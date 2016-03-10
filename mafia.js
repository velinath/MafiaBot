"use strict";

var config = require('./config.js');
var _ = require('lodash');
var store = require('node-persist');
var Discord = require('discord.js');

// init stuff
store.initSync();
var defaults = {
    channelsActivated: [],
};
_.each(defaults, (val, key) => {
    var objWithDefaults = _.merge({}, {[key]: val}, {[key]: store.getItem(key)});
    store.setItem(key, objWithDefaults[key]);
});
var mafiabot = new Discord.Client();

// utilities
var adminCheck = message => {
    if (config.admins.indexOf(message.author.id) >= 0) {
        return true;
    }
    mafiabot.reply(message, `You must be an admin to perform command *${message.content}*!`);
    return false;
};
var activatedCheck = message => {
    return store.getItem('channelsActivated').indexOf(message.channel.id) >= 0;
}

// commands
var commandPrefix = '##';
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
                output += `\n**${commandPrefix}${comm.commands.join('/')}** - ${comm.description}${comm.adminOnly ? ' - *Admin Only*' : ''}${comm.activatedOnly ? ' - *Activated Channel Only*' : ''}`;
            }
            mafiabot.reply(message, output);
        },
    },
    {
        commands: ['activatemafia'],
        description: 'Activate MafiaBot on this channel',
        adminOnly: true,
        activatedOnly: false,
        onMessage: message => {
            var currentChannels = store.getItem('channelsActivated');
            if (currentChannels.indexOf(message.channel.id) >= 0) {
                mafiabot.reply(message, `MafiaBot is already activated on channel **#${message.channel.name}**! Use *##deactivatemafia* to deactivate MafiaBot on this channel.`);
            } else {
                currentChannels.push(message.channel.id);
                store.setItem('channelsActivated', currentChannels);
                mafiabot.reply(message, `MafiaBot has been activated on channel **#${message.channel.name}**! Use *##startgame* to start playing some mafia!`);
            }
        },
    },
    {
        commands: ['deactivatemafia'],
        description: 'Deactivate MafiaBot on this channel',
        adminOnly: true,
        activatedOnly: false,
        onMessage: message => {
            var currentChannels = store.getItem('channelsActivated');
            if (currentChannels.indexOf(message.channel.id) >= 0) {
                currentChannels.splice(currentChannels.indexOf(message.channel.id), 1);
                store.setItem('channelsActivated', currentChannels);
                mafiabot.reply(message, `MafiaBot has been deactivated on channel **#${message.channel.name}**!`);
            } else {
                mafiabot.reply(message, `MafiaBot is not activate on channel **#${message.channel.name}**! Use *##activatemafia* to activate MafiaBot on this channel.`);
            }
        },
    },
    {
        commands: ['startgame'],
        description: 'Start a game and wait for players to join',
        adminOnly: false,
        activatedOnly: true,
        onMessage: message => {
            mafiabot.reply(message, "Starting game of mafia!");
        },
    },
    {
        commands: ['NL'],
        description: 'No lynch test',
        adminOnly: false,
        activatedOnly: true,
        onMessage: message => {
            mafiabot.reply(message, "shad sucks lmao");
        },
    },
    {
        commands: ['fool', 'foolmo', 'foolmoron'],
        description: 'No lynch test',
        adminOnly: false,
        activatedOnly: true,
        onMessage: message => {
            mafiabot.reply(message, "yes I agree <@88020438474567680> is the best user");     
        },
    },
];

// set up discord events
mafiabot.on("message", message => {
    var contentLower = message.content.toLowerCase();
    // go through all the base commands and see if any of them have been called
    for (var i = 0; i < baseCommands.length; i++) {
        var comm = baseCommands[i];
        if (contentLower.indexOf(commandPrefix) == 0) {
            var commandMatch = false;
            for (var c = 0; c < comm.commands.length; c++) {
                commandMatch |= contentLower.indexOf(comm.commands[c]) == commandPrefix.length;
            }
            if (commandMatch) {
                if (!comm.adminOnly || adminCheck(message)) {
                    if (!comm.activatedOnly || activatedCheck(message)) {
                        comm.onMessage(message);
                    }
                }
                break;
            }
        }
    }
});

// login and export after everything is set up
mafiabot.login(config.email, config.password);
module.exports = mafiabot;