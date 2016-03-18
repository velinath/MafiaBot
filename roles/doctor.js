var _ = require('lodash');
var STATE = require('../gameStates.js');
var closestPlayer = require('../closestPlayer.js');

module.exports = {
    id: 'doctor',
    name: 'Doctor',
    description: `You can save someone each night with the *##save* command.`,
    isFinished: (p) => {
        return Boolean(p.player.roleData.finished);
    },
    onNight: (p) => {
        p.player.roleData.finished = false;
        p.mafiabot.sendMessage(_.find(p.mafiabot.users, {id: p.player.id}), `It is now night ${p.game.day}! Use the *##save* command to save someone.`);
    },
    onPMCommand: (p) => {
        if (p.game.state != STATE.NIGHT) {
            return;
        }
        if (p.args[0] == 'save') {
            p.mafiabot.reply(p.message, `You doctor'd <@${(closestPlayer(p.args[1], p.game.players) || {}).id}>!`);
            p.player.roleData.finished = true;
        }
    },
};