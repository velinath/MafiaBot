const _ = require('lodash');
const templates = require('./templates');
const ext = require('../lib/ext.js');

module.exports = ext(templates.singleTarget, {
    id: 'cop',
    name: 'Cop',
    description: `You can scan someone to determine if they are innocent or not each night with the *${pre}scan* command.`,
    command: 'scan',
    commandGerund: 'scanning',
    commandText: 'determine the innocence of a target',
    actionText: 'cop scan',
    onActionPhase: function(p) {
        var action = _.find(p.game.nightActions, {action: this.actionText, playerId: p.player.id});
        if (action) {
            var target = _.find(p.game.players, {id: action.targetId});
            var innocent = (target.faction != 'mafia' && target.role != 'miller') || target.role == 'godfather';
            if (this.innocenceModifier) {
                innocent = this.innocenceModifier(innocent); // allows for cop variants
            }
            p.mafiabot.sendMessage(action.playerId, `You have scanned player **<@${action.targetId}>** as **${innocent ? 'INNOCENT' : 'SCUM'}**!`);
        }
    },
});