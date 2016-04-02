const _ = require('lodash');
const templates = require('./templates');
const ext = require('../lib/ext.js');

module.exports = ext(templates.singleTarget, {
    id: 'serialkiller',
    name: 'Serial Killer',
    description: `You must choose someone to kill every night, with the *${pre}kill* command.`,
    command: 'kill',
    commandGerund: 'killing',
    commandText: 'kill a target',
    actionText: 'serial kill',
    mustDoAction: true,
    onActionPhase: function(p) {
        var action = _.find(p.game.nightActions, {action: this.actionText, playerId: p.player.id});
        if (action) {
            p.game.nightKills[action.targetId] = (p.game.nightKills[action.targetId] || 0) + 1;
        }
    },
});