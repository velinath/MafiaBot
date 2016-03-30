const _ = require('lodash');
const templates = require('./templates');

var self = templates.extend(templates.singleTarget, {
    id: 'paranoidcop',
    name: 'Cop',
    trueName: 'Paranoid Cop',
    description: `You can scan someone to determine if they are innocent or not each night with the *${pre}scan* command.`,
    secretDetails: `Scans always return scum!`,
    command: 'scan',
    commandGerund: 'scanning',
    commandText: 'determine the innocence of a target',
    actionText: 'cop scan',
    onActionPhase: (p) => {
        var action = _.find(p.game.nightActions, {action: self.actionText, playerId: p.player.id});
        if (action) {
            var target = _.find(p.game.players, {id: action.targetId});
            p.mafiabot.sendMessage(action.playerId, `You have scanned player **<@${action.targetId}>** as **SCUM**!`); // same as cop except always scum
        }
    },
});
module.exports = self;