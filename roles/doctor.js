const _ = require('lodash');
const templates = require('./templates');
const ext = require('../lib/ext.js');

module.exports = ext(templates.singleTarget, {
    id: 'doctor',
    name: 'Doctor',
    description: `You can save someone from dying each night with the *${pre}save* command.`,
    command: 'save',
    commandGerund: 'saving',
    commandText: 'protect a target from dying tonight',
    actionText: 'doctor save',
    canSelfTarget: false,
    onActionPhase: function(p) {
        var action = _.find(p.game.nightActions, {action: this.actionText, playerId: p.player.id});
        if (action) {
            p.game.nightKills[action.targetId] = (p.game.nightKills[action.targetId] || 0) - 1000;
        }
    },
});