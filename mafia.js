"use strict";
//global
global.pre = '--'; // command prefix that can be used across all files

// requires
const fs = require('fs');
const config = require('./config.js');
const _ = require('lodash');
const store = require('node-persist');
const Discord = require('discord.js');

const roles = require('./roles');
const STATE = require('./gameStates.js');

const s = require('./pluralize.js');
const closestPlayer = require('./closestPlayer.js');

// init stuff
store.initSync();
var data = _.merge({
    syncMessages: [],
    channelsActivated: [],
    pmChannels: [],
    games: [],
}, store.getItem('data'));
store.setItemSync('data', data);
var mafiabot = new Discord.Client();

// synchronous messages
mafiabot.syncMessage = (channelId, content, delay) => {
    data.syncMessages.push({
        channelId: channelId,
        content: content,
        delay: parseInt(delay) || 0,
    });
};
mafiabot.syncReply = (message, content, delay) => {
    mafiabot.syncMessage(message.channel.id, message.author + ', ' + content, delay);
};
var readyToSendSyncMessage = true;
var timeLastSentSyncMessage = new Date();

// utilities
var getRole = (roleId) => {
    return _.find(roles, {id: roleId});
}
var getRolesets = () => {
    return JSON.parse(fs.readFileSync(config.rolesetJSONPath).toString());
}
var saveRoleSets = (rolesets) => {
    fs.writeFile(config.rolesetJSONPath, JSON.stringify(rolesets));
}
var fireEvent = (event, params) => {
    return event == null ? null : event(_.assignIn({mafiabot: mafiabot, data: data}, params));
}
var getPlayerFromString = (str, channelId) => {
    var gameInChannel = _.find(data.games, {channelId: channelId});
    if (gameInChannel) {
        return closestPlayer(str, gameInChannel.players);
    }
    return null;
}
var getGameFromPlayer = (playerId) => {
    return _.find(data.games, function(game) { return _.find(game.players, {id: playerId}); });
}
var adminCheck = message => {
    if (config.admins.indexOf(message.author.id) >= 0) {
        return true;
    }
    mafiabot.reply(message, `You must be an admin to perform command *${message.content}*!`);
    return false;
};
var activatedCheck = message => {
    return data.channelsActivated.indexOf(message.channel.id) >= 0;
}
var majorityOf = listOfPlayers => {
    return Math.ceil(listOfPlayers.length / 2 + 0.1);
}
var checkForLynch = channelId => {
    var gameInChannel = _.find(data.games, {channelId: channelId});
    if (gameInChannel) {
        var votesRequired = majorityOf(_.filter(gameInChannel.players, 'alive'));
        var votesByTarget = _.groupBy(gameInChannel.votes, 'targetId');
        for (var targetId in votesByTarget) {
            if (votesByTarget[targetId].length >= votesRequired) {
                mafiabot.syncMessage(channelId, `**STOP! STOP! STOP! STOP! STOP! STOP! STOP! STOP!**\n**STOP! STOP! STOP! STOP! STOP! STOP! STOP! STOP!**\n**!! *NO TALKING AT NIGHT* !!**\n**STOP! STOP! STOP! STOP! STOP! STOP! STOP! STOP!**\n**STOP! STOP! STOP! STOP! STOP! STOP! STOP! STOP!**\n`);
                if (targetId == 'NO LYNCH') {
                    mafiabot.syncMessage(channelId, `No one was lynched.`, 1000);
                } else {
                    var lynchedPlayer = _.find(gameInChannel.players, {id: targetId});
                    mafiabot.syncMessage(channelId, `<@${lynchedPlayer.id}>, the **${lynchedPlayer.faction} ${getRole(lynchedPlayer.role).name}**, was lynched!`, 1000);
                    lynchedPlayer.alive = false;
                    lynchedPlayer.deathReason = 'Lynched D' + gameInChannel.day;
                }
                gameInChannel.state = STATE.NIGHT;
                gameInChannel.nightActionReminderTime = config.nightActionReminderInterval;
                if (!checkForGameOver(channelId)) {
                    var livePlayers = _.filter(gameInChannel.players, 'alive');
                    for (var i = 0; i < livePlayers.length; i++) {
                        var player = livePlayers[i];
                        fireEvent(getRole(player.role).onNight, {game: gameInChannel, player: player});
                        printCurrentPlayers(channelId, player.id);
                    }

                    gameInChannel.mafiaDidNightAction = false;
                    mafiabot.sendMessage(gameInChannel.mafiaChannelId, 
`It is now night ${gameInChannel.day}! Use the ***${pre}kill*** command in this chat to choose who the mafia will kill tonight (ex: *${pre}kill fool*). ***${pre}cancel*** to cancel.
Use the ***${pre}noaction*** command to confirm that you are active but taking no action tonight.

**IMPORTANT: The person who sends the kill command in this chat will be the one to perform the kill, for role purposes.**
**ALSO: If you have a power role, you must send me a private message separate from this chat to make that action!**`
                    );
                    printCurrentPlayers(channelId, gameInChannel.mafiaChannelId);
                    
                    printDayState(channelId);
                }
                return true;
            }
        }
    }
    return false;
}
var checkForGameOver = channelId => {
    var gameInChannel = _.find(data.games, {channelId: channelId});
    if (gameInChannel) {
        var livePlayers = _.filter(gameInChannel.players, 'alive');
        var liveTown = _.filter(livePlayers, {faction: 'Town'});
        var liveMafia = _.filter(livePlayers, {faction: 'Mafia'});
        if (liveTown.length && liveMafia.length) {
            return false;
        } else {
            gameInChannel.state = STATE.GAMEOVER;
            for (var i = 0; i < livePlayers.length; i++) {
                livePlayers[i].alive = false;
                livePlayers[i].deathReason = 'Survivor!';
            }
            if (liveTown.length && !liveMafia.length) {
                mafiabot.syncMessage(channelId, `***GAME OVER!***\n**THE TOWN HAS WON!!!**\nCongrats:${listUsers(_.map(_.filter(gameInChannel.players, {faction: 'Town'}), 'id'))}`);
            } else if (liveMafia.length && !liveTown.length) {
                mafiabot.syncMessage(channelId, `***GAME OVER!***\n**THE MAFIA TEAM HAS WON!!!**\nCongrats:${listUsers(_.map(_.filter(gameInChannel.players, {faction: 'Mafia'}), 'id'))}`);
            } else if (!liveTown.length && !liveMafia.length) {
                mafiabot.syncMessage(channelId, `***GAME OVER!***\n**THERE WAS... A TIE?!**`);
            }
            printCurrentPlayers(channelId);
            mafiabot.syncMessage(channelId, `Use the ***${pre}endgame*** command to end the game (and delete the mafia chat forever) so you can start a new game!`);
            return true;
        }
    }
    return false;
}

// printing
var listRoles = roles => {
    var output = '';
    var sortedRoles = _.sortBy(roles, 'name');
    for (var i = 0; i < sortedRoles.length; i++) {
        var role = sortedRoles[i];
        output += `\n***${role.id}*** | **${role.name}** | ${role.description}`;
    }
    return output;
}
var listRolesets = rolesets => {
    var output = '';
    var sortedRolesets = _.sortBy(rolesets, set => set.roles.length);
    for (var i = 0; i < sortedRolesets.length; i++) {
        var roleset = sortedRolesets[i];
        var formattedRoles = _.map(roleset.roles, role => `\`${role.faction} ${getRole(role.role).name}\``).join(', ');
        output += `\n***${roleset.name}* (${roleset.roles.length})** | ${formattedRoles}`;
    }
    return output;
}
var listUsers = listOfUserIds => {
    var output = '';
    for (var i = 0; i < listOfUserIds.length; i++) {
        output += `\n${i + 1}. <@${listOfUserIds[i]}>`;
    }
    return output;
}
var printCurrentPlayers = (channelId, outputChannelId) => {
    var gameInChannel = _.find(data.games, {channelId: channelId});
    if (gameInChannel) {
        var output = `Currently ${s(gameInChannel.players.length, 'player')} in game hosted by <@${gameInChannel.hostId}>:`;
        for (var i = 0; i < gameInChannel.players.length; i++) {
            var player = gameInChannel.players[i];
            output += `\n${i + 1}) `;
            if (player.alive) {
                output += `\`${player.name}\``;
            } else {
                output += `~~\`${player.name}\`~~ - ${player.faction} ${getRole(player.role).name} - *${player.deathReason}*`;
            }
        }
        mafiabot.syncMessage(outputChannelId || channelId, output);
        return true;
    }
    return false;
}
var printUnconfirmedPlayers = (channelId, outputChannelId) => {
    var gameInChannel = _.find(data.games, {channelId: channelId});
    if (gameInChannel) {
        var unconfirmedPlayers = _.filter(gameInChannel.players, {confirmed: false});
        var output = unconfirmedPlayers.length 
            ? `${s(unconfirmedPlayers.length, 'player')} still must ${pre}confirm for game hosted by <@${gameInChannel.hostId}>:${listUsers(_.map(unconfirmedPlayers, 'id'))}`
            : `All players confirmed for game hosted by <@${gameInChannel.hostId}>!`
            ;
        mafiabot.syncMessage(outputChannelId || channelId, output);
        return true;
    }
    return false;
}
var printDayState = (channelId, outputChannelId) => {
    var gameInChannel = _.find(data.games, {channelId: channelId});
    if (gameInChannel && gameInChannel.day > 0) {
        var output = `It is currently **${gameInChannel.state == STATE.DAY ? 'DAY' : 'NIGHT'} ${gameInChannel.day}** in game hosted by <@${gameInChannel.hostId}>!`
        if (gameInChannel.state == STATE.DAY) {
            output += `\n**${_.filter(gameInChannel.players, 'alive').length} alive, ${majorityOf(_.filter(gameInChannel.players, 'alive'))} to lynch!**\nUse ${pre}vote, ${pre}NL, and ${pre}unvote commands to vote.`;
        } else {
            output += `\n**Send in your night actions via PM. Every player must send in a night action, regardless of role!**.`;
        }
        mafiabot.syncMessage(outputChannelId || channelId, output);
        return true;
    }
    return false;
};
var printCurrentVotes = (channelId, outputChannelId) => {
    var gameInChannel = _.find(data.games, {channelId: channelId});
    if (gameInChannel && gameInChannel.day > 0) {
        var voteOutput = '';
        if (gameInChannel.votes.length) {
            var votesByTarget = _.sortBy(_.toArray(_.groupBy(gameInChannel.votes, 'targetId')), function(group) { return -group.length; });
            for (var i = 0; i < votesByTarget.length; i++) {
                var voteId = votesByTarget[i][0].targetId;
                if (voteId !== 'NO LYNCH') {
                    voteId = '<@' + voteId + '>';
                }
                voteOutput += `\n(${votesByTarget[i].length}) ${voteId}: ${_.map(_.sortBy(votesByTarget[i], function(vote) { return vote.time }), function(vote) { return '`' + _.find(gameInChannel.players, {id: vote.playerId}).name + '`'; }).join(', ')}`;
            }
        } else {
            voteOutput += `**\nThere are currently no votes!**`;
        }
        mafiabot.syncMessage(outputChannelId || channelId,
`**${_.filter(gameInChannel.players, 'alive').length} alive, ${majorityOf(_.filter(gameInChannel.players, 'alive'))} to lynch!**
Use ${pre}vote, ${pre}NL, and ${pre}unvote commands to vote.${voteOutput}`
            );
        return true;
    }
    return false;
}

// commands
var baseCommands = [
    {
        commands: ['commands', 'help', 'wut'],
        description: 'Show list of commands',
        adminOnly: false,
        activatedOnly: false,
        onMessage: message => {
            var output = `\nType one of the following commands to interact with MafiaBot:`;
            for (var i = 0; i < baseCommands.length; i++) {
                var comm = baseCommands[i];
                output += `\n**${pre}${comm.commands.join('/')}** - ${comm.description}${comm.adminOnly ? ' - *Admin Only*' : ''}${comm.activatedOnly ? ' - *Activated Channel Only*' : ''}`;
            }
            mafiabot.reply(message, output);
        },
    },
    {
        commands: ['feedback', 'bug', 'bugreport'],
        description: 'Send feedback and comments and suggestions about MafiaBot to the admin',
        adminOnly: false,
        activatedOnly: false,
        onMessage: message => {
            var output = `## Server: ${message.channel.server.name} | Channel: ${message.channel.name} | User: ${message.author.name} | ${new Date()} | ${new Date(message.timestamp)} ##\n${message.content.substring(11)}\n\n`;
            fs.appendFile(config.feedbackFilePath, output);
            mafiabot.reply(message, `Thanks for the feedback! ❤`);
        },
    },
    {
        commands: ['activatemafia'],
        description: 'Activate MafiaBot on this channel',
        adminOnly: true,
        activatedOnly: false,
        onMessage: message => {
            if (data.channelsActivated.indexOf(message.channel.id) >= 0) {
                mafiabot.reply(message, `MafiaBot is already activated in *<#${message.channel.id}>*! Use *${pre}deactivatemafia* to deactivate MafiaBot on this channel.`);
            } else {
                data.channelsActivated.push(message.channel.id);
                mafiabot.reply(message, `MafiaBot has been activated in *<#${message.channel.id}>*! Use *${pre}creategame* to start playing some mafia!`);
            }
        },
    },
    {
        commands: ['deactivatemafia'],
        description: 'Deactivate MafiaBot on this channel',
        adminOnly: true,
        activatedOnly: false,
        onMessage: message => {
            if (data.channelsActivated.indexOf(message.channel.id) >= 0) {
                data.channelsActivated.splice(data.channelsActivated.indexOf(message.channel.id), 1);
                mafiabot.reply(message, `MafiaBot has been deactivated in *<#${message.channel.id}>*!`);
            } else {
                mafiabot.reply(message, `MafiaBot is not activate in *<#${message.channel.id}>*! Use *${pre}activatemafia* to activate MafiaBot on this channel.`);
            }
        },
    },
    {
        commands: ['roles'],
        description: 'Show all available roles',
        adminOnly: false,
        activatedOnly: true,
        onMessage: message => {
            mafiabot.reply(message, `Here the list of available roles:${listRoles(roles)}`);
        },
    },
    {
        commands: ['rolesets'],
        description: 'Show all available role sets',
        adminOnly: false,
        activatedOnly: true,
        onMessage: message => {
            mafiabot.reply(message, `Here the list of available rolesets:${listRolesets(getRolesets())}`);
        },
    },
    // {
    //     commands: ['addroleset'],
    //     description: 'Add a role set using a specific format: ',
    //     adminOnly: false,
    //     activatedOnly: true,
    //     onMessage: message => {
    //     },
    // },
    // {
    //     commands: ['deleteroleset'],
    //     description: 'Delete a roleset',
    //     adminOnly: true,
    //     activatedOnly: true,
    //     onMessage: message => {
    //     },
    // },
    {
        commands: ['admin', 'admins'],
        description: 'Show list of admins for MafiaBot',
        adminOnly: false,
        activatedOnly: false,
        onMessage: message => {
            mafiabot.sendMessage(message.channel, `Admins of MafiaBot:${listUsers(config.admins)}`);
        },
    },
    {
        commands: ['host', 'hosts'],
        description: 'Show host of current game in channel',
        adminOnly: false,
        activatedOnly: true,
        onMessage: message => {
            var gameInChannel = _.find(data.games, {channelId: message.channel.id});
            if (gameInChannel) {
                mafiabot.sendMessage(message.channel, `Host of current game in channel:\n<@${gameInChannel.hostId}>`);
            } else {
                mafiabot.reply(message, `There's no game currently running in <#${message.channel.id}>!`);
            }
        },
    },
    {
        commands: ['player', 'players'],
        description: 'Show current list of players of game in channel',
        adminOnly: false,
        activatedOnly: true,
        onMessage: message => {
            if (!printCurrentPlayers(message.channel.id)) {
                mafiabot.reply(message, `There's no game currently running in <#${message.channel.id}>!`);
            }
        },
    },
    {
        commands: ['day', 'info'],
        description: 'Show current day information',
        adminOnly: false,
        activatedOnly: true,
        onMessage: message => {
            if (!printDayState(message.channel.id)) {
                mafiabot.reply(message, `There's no game currently running in <#${message.channel.id}>!`);
            }
        },
    },
    {
        commands: ['votes', 'votals'],
        description: 'Show current list of votes for the game in channel',
        adminOnly: false,
        activatedOnly: true,
        onMessage: message => {
            if (!printCurrentVotes(message.channel.id)) {
                mafiabot.reply(message, `There's no game currently running in <#${message.channel.id}>!`);
            }
        },
    },
    {
        commands: ['creategame'],
        description: 'Create a game in this channel and become the host',
        adminOnly: false,
        activatedOnly: true,
        onMessage: message => {
            var gameInChannel = _.find(data.games, {channelId: message.channel.id});
            if (gameInChannel) {
                mafiabot.reply(message, `A game is already running in <#${message.channel.id}> hosted by <@${gameInChannel.hostId}>!`);
            } else {
                gameInChannel = {
                    hostId: message.author.id,
                    channelId: message.channel.id,
                    mafiaChannelId: null,
                    players: [],
                    votesToEndGame: [],
                    state: STATE.INIT,
                    day: 0,
                    night: false,
                    votes: [],
                    nightActions: [],
                    nightKills: {},
                    mafiaDidNightAction: false,
                    nightActionReminderTime: config.nightActionReminderInterval,
                };
                data.games.push(gameInChannel);
                mafiabot.sendMessage(message.channel, `Starting a game of mafia in <#${message.channel.id}> hosted by <@${gameInChannel.hostId}>!`);
            }
        },
    },
    {
        commands: ['endgame'],
        description: 'Current host, admin, or majority of players can end the game in this channel',
        adminOnly: false,
        activatedOnly: true,
        onMessage: message => {
            var gameInChannel = _.find(data.games, {channelId: message.channel.id});
            var endGame = becauseOf => {
                _.remove(data.games, gameInChannel);
                mafiabot.deleteChannel(gameInChannel.mafiaChannelId);
                mafiabot.sendMessage(message.channel, `${becauseOf} ended game of mafia in <#${message.channel.id}> hosted by <@${gameInChannel.hostId}>! 😥`);
            };
            if (gameInChannel) {
                if (gameInChannel.hostId == message.author.id) {
                    endGame(`Host <@${message.author.id}>`);
                } else if (config.admins.indexOf(message.author.id) >= 0) {
                    endGame(`Admin <@${message.author.id}>`);
                } else if (_.find(gameInChannel.players, {id: message.author.id})) {
                    if (gameInChannel.votesToEndGame.indexOf(message.author.id) >= 0) {
                        mafiabot.reply(message, `We already know you want to end the current game hosted by <@${gameInChannel.hostId}>!`);
                    } else {
                        gameInChannel.votesToEndGame.push(message.author.id);
                        mafiabot.reply(message, `You voted to end the current game hosted by <@${gameInChannel.hostId}>!`);
                        
                        var votesRemaining = majorityOf(gameInChannel.players) - gameInChannel.votesToEndGame.length;
                        if (votesRemaining <= 0) {
                            endGame('A majority vote of the players');
                        } else {
                            mafiabot.sendMessage(message.channel, `There are currently ${s(gameInChannel.votesToEndGame.length, 'vote')} to end the current game hosted by <@${gameInChannel.hostId}>. ${s(votesRemaining, 'vote')} remaining!`);
                        }
                    }
                } else {
                    mafiabot.reply(message, `Only admins, hosts, and joined players can end a game!`);
                }
            } else {
                mafiabot.reply(message, `There's no game currently running in <#${message.channel.id}>!`);
            }
        },
    },
    {
        commands: ['startgame'],
        description: 'Current host can start game with current list of players',
        adminOnly: false,
        activatedOnly: true,
        onMessage: message => {
            var gameInChannel = _.find(data.games, {channelId: message.channel.id});
            if (gameInChannel) {
                if (gameInChannel.hostId == message.author.id) {
                    if (gameInChannel.state == STATE.INIT) {
                        // see if there are any available rolesets for this number of players
                        var possibleRolesets = _.filter(getRolesets(), set => set.roles.length == gameInChannel.players.length);
                        if (possibleRolesets.length) {
                            mafiabot.createChannel(message.channel, 'mafia' + Math.random().toString().substring(2), 'text', (error, mafiaChannel) => {
                                if (mafiaChannel) {
                                    gameInChannel.state = STATE.CONFIRMING;
                                    gameInChannel.mafiaChannelId = mafiaChannel.id;
                                    mafiabot.syncMessage(message.channel.id, `Sending out roles for game of mafia hosted by <@${gameInChannel.hostId}>! Check your PMs for info and type **${pre}confirm** in this channel to confirm your role.`);
                                    printCurrentPlayers(message.channel.id);

                                    // pick a random available roleset and randomly assign the roles
                                    var roleset = possibleRolesets[Math.floor(Math.random()*possibleRolesets.length)];
                                    console.log('Picking roleset:', roleset.name);
                                    var shuffledRoles = _.shuffle(roleset.roles);
                                    for (var i = 0; i < gameInChannel.players.length; i++) {
                                        var player = gameInChannel.players[i];
                                        player.faction = shuffledRoles[i].faction;
                                        player.role = shuffledRoles[i].role;
                                        console.log('    ', player.name, player.faction, player.role);
                                        mafiabot.sendMessage(player.id, `Your role is ***${player.faction} ${getRole(player.role).name}***.\n${getRole(player.role).description}\nType **${pre}confirm** in <#${message.channel.id}> to confirm your participation in the game of mafia hosted by <@${gameInChannel.hostId}>.`);
                                    }

                                    var everyoneId = _.find(mafiaChannel.server.roles, {name: "@everyone"}).id;
                                    var mafiaPlayers = _.filter(gameInChannel.players, {faction: 'Mafia'});
                                    mafiabot.overwritePermissions(mafiaChannel, everyoneId, { readMessages: false, sendMessages: false });
                                    for (var i = 0; i < mafiaPlayers.length; i++) {
                                        var mafiaPlayer = _.find(mafiabot.users, {id: mafiaPlayers[i].id});
                                        mafiabot.overwritePermissions(mafiaChannel, mafiaPlayer, { readMessages: true, sendMessages: true });
                                        mafiabot.sendMessage(mafiaPlayer, `Use the channel <#${mafiaChannel.id}> to chat with your fellow Mafia team members, and to send in your nightly kill.`);
                                    }
                                    mafiabot.syncMessage(mafiaChannel.id, `**Welcome to the mafia team!**\nYour team is:${listUsers(_.map(mafiaPlayers, 'id'))}`);
                                    mafiabot.syncMessage(mafiaChannel.id, `As a team you have **1 kill each night**. Use the ***${pre}kill*** command (ex: *${pre}kill fool*) to use that ability when I prompt you in this chat.`);
                                }
                            });
                        } else {
                            mafiabot.reply(message, `Sorry, there are no available rolesets for ${s(gameInChannel.players.length, 'player')}! Use the **${pre}addroleset** command to add a new roleset for this number of players.`);
                        }
                    } else if (gameInChannel.state == STATE.READY) {
                        gameInChannel.state = STATE.DAY;
                        gameInChannel.day = 1;
                        var livePlayers = _.filter(gameInChannel.players, 'alive');
                        for (var i = 0; i < livePlayers.length; i++) {
                            var player = livePlayers[i];
                            fireEvent(getRole(player.role).onGameStart, {game: gameInChannel, player: player});
                        }
                        mafiabot.syncMessage(message.channel.id, `All players have confirmed and host <@${gameInChannel.hostId}> is now starting the game of mafia!`);
                        printCurrentPlayers(message.channel.id);
                        printDayState(message.channel.id);
                    }
                } else {
                    mafiabot.reply(message, `Only hosts can start the game!`);
                }
            } else {
                mafiabot.reply(message, `There's no game currently running in <#${message.channel.id}>!`);
            }
        },
    },
    {
        commands: ['join', 'in'],
        description: 'Join the game in this channel as a player',
        adminOnly: false,
        activatedOnly: true,
        onMessage: message => {
            var gameInChannel = _.find(data.games, {channelId: message.channel.id});
            if (gameInChannel) {
                if (gameInChannel.state == STATE.INIT) {
                    if (!_.find(data.pmChannels, {playerId: message.author.id})) {
                        mafiabot.reply(message, `You need to send me a private message to open up a direct channel of communication between us before you can join a game!`);
                    } else if (_.find(gameInChannel.players, {id: message.author.id})) {
                        mafiabot.reply(message, `You are already in the current game hosted by <@${gameInChannel.hostId}>!`);
                    } else {
                        var newPlayer = {
                            id: message.author.id,
                            name: message.author.name,
                            confirmed: false,
                            alive: true,
                            deathReason: '',
                            faction: null,
                            role: null,
                            roleData: {
                                actions: [],
                            },
                        };
                        gameInChannel.players.push(newPlayer);
                        mafiabot.syncMessage(message.channel.id, `<@${message.author.id}> joined the current game hosted by <@${gameInChannel.hostId}>!`);
                        printCurrentPlayers(message.channel.id);
                    }
                } else {
                    mafiabot.reply(message, `The current game is already going, so the player list is locked!`);
                }
            } else {
                mafiabot.reply(message, `There's no game currently running in <#${message.channel.id}>!`);
            }
        },
    },
    {
        commands: ['unjoin', 'out', 'leave'],
        description: 'Leave the game in this channel, if you were joined',
        adminOnly: false,
        activatedOnly: true,
        onMessage: message => {
            var gameInChannel = _.find(data.games, {channelId: message.channel.id});
            if (gameInChannel) {
                if (gameInChannel.state == STATE.INIT) {
                    if (_.find(gameInChannel.players, {id: message.author.id})) {
                        _.pullAllBy(gameInChannel.players, [{id: message.author.id}], 'id');
                        mafiabot.syncMessage(message.channel.id, `<@${message.author.id}> left the current game hosted by <@${gameInChannel.hostId}>!`);
                        printCurrentPlayers(message.channel.id);
                    } else {
                        mafiabot.reply(message, `You are not currently in the current game hosted by <@${gameInChannel.hostId}>!`);
                    }
                } else {
                    mafiabot.reply(message, `The current game is already starting, so the player list is locked!`);
                }
            } else {
                mafiabot.reply(message, `There's no game currently running in <#${message.channel.id}>!`);
            }
        },
    },
    {
        commands: ['confirm'],
        description: 'Confirm your role and your participation in the game',
        adminOnly: false,
        activatedOnly: true,
        onMessage: (message, args) => {
            var gameInChannel = _.find(data.games, {channelId: message.channel.id});
            if (gameInChannel && gameInChannel.state == STATE.CONFIRMING) {
                var player = _.find(gameInChannel.players, {id: message.author.id});
                if (player) {
                    player.confirmed = true;
                    mafiabot.syncReply(message, `Thanks for confirming for the current game hosted by <@${gameInChannel.hostId}>!`);
                    printUnconfirmedPlayers(message.channel.id);

                    var unconfirmedPlayers = _.filter(gameInChannel.players, {confirmed: false});
                    if (!unconfirmedPlayers.length) {
                        gameInChannel.state = STATE.READY;
                    }
                }
            }
        },
    },
    {
        commands: ['vote', 'lynch'],
        description: 'Vote to lynch a player',
        default: true,
        adminOnly: false,
        activatedOnly: true,
        onMessage: (message, args) => {
            var gameInChannel = _.find(data.games, {channelId: message.channel.id});
            if (gameInChannel && gameInChannel.state == STATE.DAY) {
                var player = _.find(gameInChannel.players, {id: message.author.id});
                if (player && player.alive) {
                    var target = getPlayerFromString(args[1], message.channel.id);
                    if (target) {
                        if (!target.alive) {
                            mafiabot.reply(message, `You can't vote for the dead player ${args[1]}!`);
                        } else if (target.id == message.author.id) {
                            mafiabot.reply(message, `You can't vote for yourself!`);
                        } else {
                            _.pullAllBy(gameInChannel.votes, [{playerId: message.author.id}], 'playerId');
                            gameInChannel.votes.push({playerId: message.author.id, targetId: target.id, time: new Date()});
                            mafiabot.syncMessage(message.channel.id, `<@${message.author.id}> voted to lynch <@${target.id}>!`);

                            printCurrentVotes(message.channel.id);
                            checkForLynch(message.channel.id);
                        }
                    } else {
                        mafiabot.reply(message, `'${args[1]}' is not a valid vote target!`);
                    }
                }
            }
        },
    },
    {
        commands: ['nl', 'nolynch'],
        description: 'Vote for no lynch today',
        adminOnly: false,
        activatedOnly: true,
        onMessage: (message, args) => {
            var gameInChannel = _.find(data.games, {channelId: message.channel.id});
            if (gameInChannel && gameInChannel.state == STATE.DAY) {
                var player = _.find(gameInChannel.players, {id: message.author.id});
                if (player && player.alive) {
                    _.pullAllBy(gameInChannel.votes, [{playerId: message.author.id}], 'playerId');
                    gameInChannel.votes.push({playerId: message.author.id, targetId: 'NO LYNCH', time: new Date()});
                    mafiabot.syncMessage(message.channel.id, `<@${message.author.id}> voted to No Lynch!`);

                    printCurrentVotes(message.channel.id);
                    checkForLynch(message.channel.id);
                }
            }
        },
    },
    {
        commands: ['unvote', 'unlynch', 'un'],
        description: 'Remove your vote to lynch a player',
        adminOnly: false,
        activatedOnly: true,
        onMessage: (message, args) => {
            var gameInChannel = _.find(data.games, {channelId: message.channel.id});
            if (gameInChannel && gameInChannel.state == STATE.DAY) {
                var player = _.find(gameInChannel.players, {id: message.author.id});
                if (player && player.alive) {
                    var vote = _.find(gameInChannel.votes, {playerId: message.author.id});
                    _.pullAllBy(gameInChannel.votes, [{playerId: message.author.id}], 'playerId');
                    var targetString = vote ? vote.targetId === 'NO LYNCH' ? ' No Lynch' : ` <@${vote.targetId}>` : '... nothing';
                    mafiabot.syncMessage(message.channel.id, `<@${message.author.id}> unvoted${targetString}!`);
                    printCurrentVotes(message.channel.id);
                }
            }
        },
    },
];

// set up discord events
mafiabot.on("message", message => {
    var contentLower = message.content.toLowerCase();
    var args = message.content.split(/[ :]/);
    args[0] = args[0].substring(pre.length);
    // go through all the base commands and see if any of them have been called
    if (contentLower.indexOf(pre) == 0) {
        var anyCommandMatched = false;
        for (var i = 0; i < baseCommands.length; i++) {
            var comm = baseCommands[i];
            var commandMatched = false;
            for (var c = 0; c < comm.commands.length; c++) {
                commandMatched = 
                    args[0].toLowerCase().indexOf(comm.commands[c].toLowerCase()) == 0 && 
                    args[0].length == comm.commands[c].length;
                if (commandMatched) {
                    break;
                }
            }
            anyCommandMatched = anyCommandMatched || commandMatched;
            if (commandMatched) {
                if (!comm.adminOnly || adminCheck(message)) {
                    if (!comm.activatedOnly || activatedCheck(message)) {
                        comm.onMessage(message, args);
                    }
                }
                break;
            }
        }
        // call default command if no command was matched, but there was still a command prefix (like '--xxx')
        if (!anyCommandMatched) {
            var defaultComm = _.find(baseCommands, {default: true});
            if (defaultComm) {
                if (!defaultComm.adminOnly || adminCheck(message)) {
                    if (!defaultComm.activatedOnly || activatedCheck(message)) {
                        // args needs to be slightly modified for default commands (so '--xxx' has args ['', 'xxx'])
                        var args = [''].concat(message.content.split(/[ :]/));
                        args[1] = args[1].substring(pre.length);
                        defaultComm.onMessage(message, args);
                    }
                }
            }
        }
    }

    // receiving a PM
    if (message.channel.recipient) {
        // pm channel setup
        if (!_.find(data.pmChannels, {playerId: message.channel.recipient.id})) {
            data.pmChannels.push({playerId: message.channel.recipient.id, channelId: message.channel.id});
            mafiabot.reply(message, 'Thanks for the one-time private message to open a direct channel of communication between us! You can join and play mafia games on this server.');
        }
        
        var gameWithPlayer = getGameFromPlayer(message.author.id);
        if (gameWithPlayer) {
            var player = _.find(gameWithPlayer.players, {id: message.author.id});
            var role = getRole(player.role);
            if (contentLower.indexOf(pre) == 0) {
                fireEvent(role.onPMCommand, {message: message, args: args, game: gameWithPlayer, player: player});
            }
        }
    }

    // receiving message from mafia channel
    var game = _.find(data.games, {mafiaChannelId: message.channel.id});
    if (game) {
        // terrible chunk of code to emulate a vig kill
        var player = _.find(game.players, {id: message.author.id});
        var actionText = 'mafia kill';
        if (game.state == STATE.NIGHT && player && player.alive) {
            if (args[0] == 'kill') {
                var target = closestPlayer(args[1], game.players);
                if (target && target.alive) {
                    game.nightActions = _.reject(game.nightActions, {action: actionText}); // clear any mafia kill, not just the current player's
                    game.nightActions.push({ 
                        action: actionText,
                        playerId: player.id,
                        targetId: target.id,
                    });
                    game.mafiaDidNightAction = true;
                    mafiabot.reply(message, `**You are killing <@${target.id}> tonight!** Type ***${pre}cancel*** to cancel.`);
                } else {
                    mafiabot.reply(message, `*${args[1]}* is not a valid target!`);
                }
            } else if (args[0] == 'cancel' || args[0] == 'noaction') {
                var action = _.find(game.nightActions, {action: actionText});
                if (action) {
                    game.mafiaDidNightAction = false;
                    mafiabot.reply(message, `**You have canceled killing <@${action.targetId}>.**`);
                }
                game.nightActions = _.reject(game.nightActions, {action: actionText});
            }
            if (args[0] == 'noaction') {
                game.mafiaDidNightAction = true;
                mafiabot.reply(message, `**You are taking no action tonight.**`);
            }
        }
    }

    // save data after every message
    store.setItemSync('data', data);
});

// main loop
var t = new Date();
var mainLoop = function() {
    // timing stuff
    var now = new Date();
    var dt = now - t;
    t = now;

    // handle sync message taking too long to call back
    if (now - timeLastSentSyncMessage >= config.syncMessageTimeout) {
        readyToSendSyncMessage = true;
    }

    // send next sync message if possible
    if (data.syncMessages.length) {
        data.syncMessages[0].delay -= dt;
        if (readyToSendSyncMessage && data.syncMessages[0].delay <= 0) {
            var message = data.syncMessages.shift();
            mafiabot.sendMessage(message.channelId, message.content, {tts: false}, () => { readyToSendSyncMessage = true; });

            readyToSendSyncMessage = false;
            timeLastSentSyncMessage = new Date();
        }
    }

    // game-specific loops
    for (var i = 0; i < data.games.length; i++) {
        var game = data.games[i];

        if (game.state == STATE.NIGHT) {
            var livePlayers = _.filter(game.players, 'alive');
            var liveTownPlayers = _.filter(livePlayers, {faction: 'Town'});

            // check if all townies and the mafia chat have finished night actions and if so, start the day countdown
            var allTownNightActionsFinished = _.every(liveTownPlayers, (player) => {
                var result = fireEvent(getRole(player.role).isFinished, {game: game, player: player});
                return result === null || result === true;
            });
            allTownNightActionsFinished = allTownNightActionsFinished && game.mafiaDidNightAction;
            if (allTownNightActionsFinished) {
                game.timeToNightActionResolution -= dt;
                console.log('Time to day:', game.timeToNightActionResolution);
            } else {
                game.timeToNightActionResolution = config.nightActionBufferTime * (1 + Math.random()/2);
            }

            // resolve night actions and begin day after countdown
            if (game.timeToNightActionResolution <= 0) {
                for (var i = 0; i < livePlayers.length; i++) {
                    var player = livePlayers[i];
                    fireEvent(getRole(player.role).onBlockingPhase, {game: game, player: player});
                }
                for (var i = 0; i < livePlayers.length; i++) {
                    var player = livePlayers[i];
                    fireEvent(getRole(player.role).onTargetingPhase, {game: game, player: player});
                }
                for (var i = 0; i < livePlayers.length; i++) {
                    var player = livePlayers[i];
                    fireEvent(getRole(player.role).onActionPhase, {game: game, player: player});
                }
                // just do the mafia kill action here, why not
                var mafiaAction = _.find(game.nightActions, {action: 'mafia kill'});
                if (mafiaAction) {
                    game.nightKills[mafiaAction.targetId] = (game.nightKills[mafiaAction.targetId] || 0) + 1;
                }
                for (var i = 0; i < livePlayers.length; i++) {
                    var player = livePlayers[i];
                    fireEvent(getRole(player.role).onNightResolved, {game: game, player: player});
                }
                // figure out who died
                var deadPlayers = [];
                for (var playerId in game.nightKills) {
                    if (game.nightKills[playerId] > 0) {
                        var deadPlayer = _.find(game.players, {id: playerId});
                        deadPlayer.alive = false;
                        deadPlayer.deathReason = 'Died N' + game.day;
                        deadPlayers.push(deadPlayer);
                    }
                }
                // start day
                game.state = STATE.DAY;
                game.day++;
                game.votes.length = 0;
                game.nightActions.length = 0;
                game.nightKills = {};
                mafiabot.syncMessage(game.channelId, `**All players have finished night actions!**`);
                mafiabot.syncMessage(game.channelId, `***${s(deadPlayers.length, 'player', 's have', ' has')} died.***`, 1000);
                for (var i = 0; i < deadPlayers.length; i++) {
                    var deadPlayer = deadPlayers[i];
                    mafiabot.syncMessage(game.channelId, `<@${deadPlayer.id}>, the **${deadPlayer.faction} ${getRole(deadPlayer.role).name}**, has died!`, 1000);
                }
                if (!checkForGameOver(game.channelId)) {
                    mafiabot.syncMessage(game.channelId, `Day ${game.day} is now starting.`, 2000);
                    printCurrentPlayers(game.channelId);
                    printDayState(game.channelId);
                }
            }

            // send night action reminders
            game.nightActionReminderTime -= dt;
            if (game.nightActionReminderTime <= 0) {
                var remind = (playerName, channelId) => {
                    console.log('Reminding:', playerName);
                    mafiabot.sendMessage(channelId, `**HEY! *LISTEN!!*** We're waiting for your night action! Remember to use the ***--noaction*** command to confirm you are active, even if you have no night power!`);
                }
                for (var i = 0; i < liveTownPlayers.length; i++) {
                    var player = liveTownPlayers[i];
                    var result = fireEvent(getRole(player.role).isFinished, {game: game, player: player});
                    if (!(result === null || result === true)) {
                        remind(player.name, player.id);
                    }
                }
                if (!game.mafiaDidNightAction) {
                    remind('Mafia', game.mafiaChannelId);
                }
                game.nightActionReminderTime = config.nightActionReminderInterval;
            }
        }
    }

    // save and wait for next loop
    store.setItemSync('data', data);
    setTimeout(mainLoop, Math.max(config.mainLoopInterval - (new Date() - now), 0));
};

// login and kick off main loop after everything is set up
mafiabot.login(config.email, config.password).then(() => { 
    // but wait for channels to be cached first or else there will be weird bugs
    var checkForChannelsThenKickoff = () => {
        if (mafiabot.channels.length) {
            mainLoop(0);
        } else {
            setTimeout(checkForChannelsThenKickoff, 100);
        }
    }
    checkForChannelsThenKickoff();
});
module.exports = mafiabot;