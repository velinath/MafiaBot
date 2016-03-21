var _ = require('lodash');
var templates = require('./templates');
var STATE = require('../gameStates.js');
var closestPlayer = require('../closestPlayer.js');

var self = templates.extend(templates.singleTarget, {
    id: 'doctor',
    name: 'Doctor',
    description: `You can save someone from dying each night with the ***--save*** command.`,
    command: 'save',
    commandGerund: 'saving',
    commandText: 'protect a target from dying tonight',
    actionText: 'doctor save',
    onActionPhase: (p) => {
        var action = _.find(p.game.nightActions, {playerId: p.player.id});
        if (action) {
            p.game.nightKills[action.targetId] = (p.game.nightKills[action.targetId] || 0) - Infinity;
        }
    },
});
module.exports = self;