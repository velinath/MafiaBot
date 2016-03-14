var closestPlayer = require('../closestPlayer.js');

module.exports = {
    id: 'doctor',
    name: 'Doctor',
    description: `You can save someone each night with the *##save* command.`,
    onPMCommand: (mafiabot, message, args, game, data) => {
        if (args[0] == 'save') {
            mafiabot.reply(message, `You doctor'd ${closestPlayer(args[1], game.players)}!`);
        }
    }
};