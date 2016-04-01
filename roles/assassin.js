const _ = require('lodash');
const templates = require('./templates');
const s = require('../lib/pluralize.js');

const assassinCount = 1;
var self = templates.extend(templates.singleTarget, {
    id: 'assassin',
    name: 'Assassin',
    description: `You can choose to assassinate someone during night, *${s(assassinCount, 'time')}* in the whole game, with the *${pre}assassinate* command.`,
    command: 'assassinate',
    commandGerund: 'assassinating',
    commandText: 'assassinate a target',
    actionText: 'assassin assassinate',
    onGameStart: (p) => {
        p.player.roleData.assassinCount = assassinCount;
    },
    canDoAction: (p) => {
        return p.player.roleData.assassinCount > 0 ? true : 'You cannot assassinate anyone else for the rest of the game.';
    },
    preBlockingPhase: (p) => { // can't be roleblocked or bus'd or anything
        var action = _.find(p.game.nightActions, {action: self.actionText, playerId: p.player.id});
        if (action) {
            p.player.roleData.assassinCount--;
            p.game.nightKills[action.targetId] = (p.game.nightKills[action.targetId] || 0) + Infinity; // infinity so doctor can't save
        }
    },
});
module.exports = self;