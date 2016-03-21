var _ = require('lodash');
var templates = require('./templates');
var STATE = require('../gameStates.js');
var closestPlayer = require('../closestPlayer.js');

var self = templates.extend(templates.singleTarget, {
    id: 'roleblocker',
    name: 'Roleblocker',
    description: `You can block someone from performing their role each night with the ***--block*** command.`,
    command: 'block',
    commandGerund: 'blocking',
    commandText: 'block a target from performing their role',
    actionText: 'roleblocker block',
    onBlockingPhase: (p) => {
        var action = _.find(p.game.nightActions, {playerId: p.player.id});
        if (action) {
            _.pullAllBy(p.game.nightActions, [{playerId: action.targetId}], 'playerId');
            p.mafiabot.sendMessage(_.find(p.mafiabot.users, {id: action.targetId}), `**You have been roleblocked!**`);
        }
    },
});
module.exports = self;