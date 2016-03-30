const _ = require('lodash');
const templates = require('./templates');

var self = templates.extend(templates.singleTarget, {
    id: 'insanecop',
    name: 'Cop', // don't actually tell the player they are insane
    trueName: 'Insane Cop',
    description: `You can scan someone to determine if they are innocent or not each night with the *${pre}scan* command.`,
    secretDetails: `Scans are opposite of the truth!`,
    command: 'scan',
    commandGerund: 'scanning',
    commandText: 'determine the innocence of a target',
    actionText: 'cop scan',
    onActionPhase: (p) => {
        var action = _.find(p.game.nightActions, {action: self.actionText, playerId: p.player.id});
        if (action) {
            var target = _.find(p.game.players, {id: action.targetId});
            var innocent = (target.faction != 'mafia' && target.role != 'miller') || target.role == 'godfather';
            p.mafiabot.sendMessage(action.playerId, `You have scanned player **<@${action.targetId}>** as **${!innocent ? 'INNOCENT' : 'SCUM'}**!`); // same as cop except flipped results
        }
    },
});
module.exports = self;