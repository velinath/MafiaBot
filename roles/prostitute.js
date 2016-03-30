const _ = require('lodash');
const templates = require('./templates');

var self = templates.extend(templates.singleTarget, {
    id: 'prostitute',
    name: 'Prostitute',
    description: `You can sleep with someone at night to see if they got up (did an action) that night with the *${pre}sleep* command. Your target gets notified that someone slept with them.`,
    command: 'sleep',
    commandGerund: 'sleeping with',
    commandText: 'sleep with a target to see if they did an action',
    actionText: 'prostitute sleep',
    onActionPhase: (p) => {
        var action = _.find(p.game.nightActions, {action: self.actionText, playerId: p.player.id});
        if (action) {
            var targetAction = _.find(p.game.nightActions, {playerId: action.targetId});
            p.mafiabot.sendMessage(action.playerId, `You slept with player **<@${action.targetId}>** and they ${targetAction ? '**DID**' : 'did not'} get up last night!`);
            p.mafiabot.sendMessage(action.targetId, `**You have been slept with by a prostitute!**`);
        }
    },
});
module.exports = self;