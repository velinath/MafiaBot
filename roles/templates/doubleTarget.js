const _ = require('lodash');
const STATE = require('../../lib/gameStates.js');
const closestPlayer = require('../../lib/closestPlayer.js');

module.exports = (ext) => {
    var self = {
        isFinished: (p) => {
            return Boolean(p.player.roleData.noAction) || Boolean(p.player.roleData.didAction);
        },
        onNight: (p) => {
            p.player.roleData.didAction = false;
            p.player.roleData.noAction = false;
            var output = `It is now night ${p.game.day}! Use the ***${pre}${ext.command}*** command with TWO targets to ${ext.commandText} (ex: *${pre}${ext.command} fool wigs*). ***${pre}cancel*** to cancel.`;
            if (ext.mustDoAction) {
                output += `\n**NOTE**: You MUST take an action every night! You cannot do use the *${pre}noaction* command like other roles.`;
            } else {
                output += `\nUse the ***${pre}noaction*** command to confirm that you are active but taking no action tonight.`;
            }
            p.mafiabot.sendMessage(p.player.id, output);
        },
        onPMCommand: (p) => {
            if (p.game.state != STATE.NIGHT) {
                return;
            }
            if (p.args[0] == ext.command) {
                var canDoActionResult = ext.canDoAction ? ext.canDoAction(p) : true;
                if (canDoActionResult === true) {
                    var target1 = closestPlayer(p.args[1], p.game.players);
                    var target2 = closestPlayer(p.args[2], p.game.players);
                    if (target1 && target1.alive) {
                        if (target2 && target2.alive) {
                            if ((target1.id != p.player.id && target2.id != p.player.id) || ext.canSelfTarget || ext.canSelfTarget == null) {
                                if (target1.id != target2.id) {
                                    p.game.nightActions = _.reject(p.game.nightActions, {action: ext.actionText, playerId: p.player.id});
                                    p.game.nightActions.push({
                                        action: ext.actionText,
                                        playerId: p.player.id,
                                        targetId: target1.id,
                                    });
                                    p.game.nightActions.push({
                                        action: ext.actionText,
                                        playerId: p.player.id,
                                        targetId: target2.id,
                                    });
                                    p.player.roleData.didAction = true;
                                    p.mafiabot.reply(p.message, `**You are ${ext.commandGerund} <@${target1.id}> and <@${target2.id}> tonight!** Type ***${pre}cancel*** to cancel.`);
                                } else {
                                    p.mafiabot.reply(p.message, `Your two targets must be different!`);
                                }
                            } else {
                                p.mafiabot.reply(p.message, `As a ${ext.name}, you cannot target yourself at night!`);
                            }
                        } else {
                            p.mafiabot.reply(p.message, `*${p.args[2]}* is not a valid target! You need to list TWO valid targets.`);
                        }
                    } else {
                        p.mafiabot.reply(p.message, `*${p.args[1]}* is not a valid target! You need to list TWO valid targets.`);
                    }
                } else {
                    p.mafiabot.reply(p.message, `You can't ${ext.command} tonight. ${canDoActionResult}`);
                }
            } else if (p.args[0] == 'cancel' || (!ext.mustDoAction && p.args[0] == 'noaction')) {
                var action = _.find(p.game.nightActions, {action: self.actionText, playerId: p.player.id});
                if (action) {
                    p.player.roleData.didAction = false;
                    p.mafiabot.reply(p.message, `**You have canceled ${ext.commandGerund} <@${action.targetId}>.**`);
                }
                p.game.nightActions = _.reject(p.game.nightActions, {action: ext.actionText, playerId: p.player.id});
            }
            if (!ext.mustDoAction && p.args[0] == 'noaction') {
                p.player.roleData.noAction = true;
                p.mafiabot.reply(p.message, `**You are taking no action tonight.**`);
            }
        },
    };
    return self;
};