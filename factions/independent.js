const _ = require('lodash');

var self = {
    id: 'independent',
    name: 'Independent',
    description: `You win only when you are the last one standing!`,
    isVictory: (p) => {
        var livePlayers = _.filter(p.game.players, 'alive');
        // only self is alive
        return livePlayers.length === 1 && livePlayers[0].id === p.player.id;
    },
};
module.exports = self;