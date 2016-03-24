const _ = require('lodash');
const STATE = require('../../gameStates.js');
const closestPlayer = require('../../closestPlayer.js');

module.exports = (ext) => {
    var self = {
        isFinished: (p) => {
            return Boolean(p.player.roleData.noAction) || Boolean(p.player.roleData.didAction);
        },
        onNight: (p) => {
            p.player.roleData.didAction = false;
            p.player.roleData.noAction = false;
            p.mafiabot.sendMessage(_.find(p.mafiabot.users, {id: p.player.id}), `It is now night ${p.game.day}! Use the ***${pre}${ext.command}*** command to ${ext.commandText}, ***${pre}cancel*** to cancel.\nUse the ***${pre}noaction*** command to confirm that you are active but taking no action tonight.`);
        },
        onPMCommand: (p) => {
            if (p.game.state != STATE.NIGHT) {
                return;
            }
            if (p.args[0] == ext.command) {
                var canDoActionResult = ext.canDoAction ? ext.canDoAction(p) : true;
                if (canDoActionResult === true) {
                    var target = closestPlayer(p.args[1], p.game.players);
                    if (target && target.alive) {
                        p.game.nightActions = _.reject(p.game.nightActions, {action: ext.actionText, playerId: p.player.id});
                        p.game.nightActions.push({ 
                            action: ext.actionText,
                            playerId: p.player.id,
                            targetId: target.id,
                        });
                        p.player.roleData.didAction = true;
                        p.mafiabot.reply(p.message, `You are ${ext.commandGerund} **<@${target.id}>** tonight! Type ***${pre}cancel*** to cancel.`);
                    } else {
                        p.mafiabot.reply(p.message, `*${p.args[1]}* is not a valid target!`);
                    }
                } else {
                    p.mafiabot.reply(p.message, `You can't ${ext.command} tonight. ${canDoActionResult}`);
                }
            } else if (p.args[0] == 'cancel' || p.args[0] == 'noaction') {
                var action = _.find(p.game.nightActions, {playerId: p.player.id});
                if (action) {
                    p.player.roleData.didAction = false;
                    p.mafiabot.reply(p.message, `You have canceled ${ext.commandGerund} **<@${action.targetId}>**.`);
                }
                p.game.nightActions = _.reject(p.game.nightActions, {action: ext.actionText, playerId: p.player.id});
            }
            if (p.args[0] == 'noaction') {
                p.player.roleData.noAction = true;
                p.mafiabot.reply(p.message, `You are taking no action tonight.`);
            }
        },
    };
    return self;
};