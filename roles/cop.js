var _ = require('lodash');
var templates = require('./templates');
var STATE = require('../gameStates.js');
var closestPlayer = require('../closestPlayer.js');

var self = templates.extend(templates.singleTarget, {
    id: 'cop',
    name: 'Cop',
    description: `You can scan someone to determine if they are innocent or not each night with the ***${pre}scan*** command.`,
    command: 'scan',
    commandGerund: 'scanning',
    commandText: 'determine the innocence of a target',
    actionText: 'cop scan',
    onActionPhase: (p) => {
        var action = _.find(p.game.nightActions, {playerId: p.player.id});
        if (action) {
            var target = _.find(p.game.players, {id: action.targetId});
            var innocent = target.faction != 'Mafia';
            p.mafiabot.sendMessage(_.find(p.mafiabot.users, {id: action.playerId}), `You have scanned player **<@${action.targetId}>** as **${innocent ? 'INNOCENT' : 'SCUM'}**!`);
        }
    },
});
module.exports = self;