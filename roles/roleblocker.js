const _ = require('lodash');
const templates = require('./templates');

var self = templates.extend(templates.singleTarget, {
    id: 'roleblocker',
    name: 'Roleblocker',
    description: `You can block someone from performing their role each night with the ***${pre}block*** command.`,
    command: 'block',
    commandGerund: 'blocking',
    commandText: 'block a target from performing their role',
    actionText: 'roleblocker block',
    onBlockingPhase: (p) => {
        var action = _.find(p.game.nightActions, {action: self.actionText, playerId: p.player.id});
        if (action) {
            p.game.nightActions = _.reject(p.game.nightActions, {playerId: action.targetId});
            p.mafiabot.sendMessage(_.find(p.mafiabot.users, {id: action.targetId}), `**You have been roleblocked!**`);
        }
    },
});
module.exports = self;