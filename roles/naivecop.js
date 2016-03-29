const _ = require('lodash');
const templates = require('./templates');

var self = templates.extend(templates.singleTarget, {
    id: 'naivecop',
    name: 'Cop',
    trueName: 'Naive Cop',
    description: `You can scan someone to determine if they are innocent or not each night with the *${pre}scan* command.`,
    secretDetails: `Scans always return innocent!`,
    command: 'scan',
    commandGerund: 'scanning',
    commandText: 'determine the innocence of a target',
    actionText: 'cop scan',
    onActionPhase: (p) => {
        var action = _.find(p.game.nightActions, {action: self.actionText, playerId: p.player.id});
        if (action) {
            var target = _.find(p.game.players, {id: action.targetId});
            p.mafiabot.sendMessage(_.find(p.mafiabot.users, {id: action.playerId}), `You have scanned player **<@${action.targetId}>** as **INNOCENT**!`); // same as cop except always innocent
        }
    },
});
module.exports = self;