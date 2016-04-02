const _ = require('lodash');
const templates = require('./templates');

var self = templates.extend(templates.singleTarget, {
    id: 'bodyguard',
    name: 'Bodyguard',
    description: `You can guard someone each night, dying in place of them if there was an attempted kill, with the *${pre}guard* command.`,
    command: 'guard',
    commandGerund: 'guarding',
    commandText: 'guard a target from dying tonight, in exchange for your life',
    actionText: 'bodyguard guard',
    canSelfTarget: false,
    onNightResolved: (p) => { // do bodyguard after all kills have gone through
        var action = _.find(p.game.nightActions, {action: self.actionText, playerId: p.player.id});
        if (action) {
            if (p.game.nightKills[action.targetId] > 0) {
                p.game.nightKills[action.targetId] = (p.game.nightKills[action.targetId] || 0) - 1000;
                p.game.nightKills[action.playerId] = (p.game.nightKills[action.playerId] || 0) + 1;
            }
        }
    },
});
module.exports = self;