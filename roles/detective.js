const _ = require('lodash');
const templates = require('./templates');

var self = templates.extend(templates.singleTarget, {
    id: 'detective',
    name: 'Detective',
    description: `You can scan someone to determine their role each night with the *${pre}scan* command.`,
    command: 'scan',
    commandGerund: 'scanning',
    commandText: 'determine the role of a target',
    actionText: 'detective scan',
    onActionPhase: (p) => {
        var action = _.find(p.game.nightActions, {action: self.actionText, playerId: p.player.id});
        if (action) {
            var target = _.find(p.game.players, {id: action.targetId});
            p.mafiabot.sendMessage(action.playerId, `You have scanned player **<@${action.targetId}>**'s role as **${target.role}**!`);
        }
    },
});
module.exports = self;