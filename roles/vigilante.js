var s = require('../pluralize.js');
var closestPlayer = require('../closestPlayer.js');

var shotCount = 1;
module.exports = {
    id: 'vigilante',
    name: 'Vigilante',
    description: `You can choose to shoot someone during night **${s(shotCount, 'time')} in the whole game** with the *##vig* command.`,
    onPMCommand: (mafiabot, message, args, game, data) => {
        if (args[0] == 'vig') {
            mafiabot.reply(message, `Yeah bro you totally killed ${closestPlayer(args[1], game.players)}!`);
        }
    }
};