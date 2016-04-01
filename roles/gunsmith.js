const _ = require('lodash');
const templates = require('./templates');

var self = templates.extend(templates.singleTarget, {
    id: 'gunsmith',
    name: 'Gunsmith',
    description: `You can scan someone to determine if they have a gun (Mafia, Cop, Vigilante, etc.) or not each night with the *${pre}scan* command.`,
    command: 'scan',
    commandGerund: 'scanning',
    commandText: 'determine if the target has a gun',
    actionText: 'gunsmith scan',
    onActionPhase: (p) => {
        var action = _.find(p.game.nightActions, {action: self.actionText, playerId: p.player.id});
        if (action) {
            var target = _.find(p.game.players, {id: action.targetId});
            var gunHavingRoles = ['cop', 'insanecop', 'naivecop', 'paranoidcop', 'detective', 'pgo', 'vigilante'];
            var hasGun = target.faction === 'mafia' || gunHavingRoles.indexOf(target.role) >= 0;
            p.mafiabot.sendMessage(action.playerId, `You ${hasGun ? '**DID**' : 'did not'} find a gun on scanned player **<@${action.targetId}>**!`);
        }
    },
});
module.exports = self;