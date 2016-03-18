var _ = require('lodash');
var STATE = require('../gameStates.js');
var s = require('../pluralize.js');
var closestPlayer = require('../closestPlayer.js');

var shotCount = 1;
module.exports = {
    id: 'vigilante',
    name: 'Vigilante',
    description: `You can choose to shoot someone during night **${s(shotCount, 'time')} in the whole game** with the *##vig* command.`,
    isFinished: (p) => {
        return Boolean(p.player.roleData.finished);
    },
    onNight: (p) => {
        p.player.roleData.finished = false;
        p.mafiabot.sendMessage(_.find(p.mafiabot.users, {id: p.player.id}), `It is now night ${p.game.day}! Use the *##vig* command to kill someone. You have ${s(shotCount, 'bullet')} left.`);
    },
    onPMCommand: (p) => {
        if (p.game.state != STATE.NIGHT) {
            return;
        }
        if (p.args[0] == 'vig') {
            p.mafiabot.reply(p.message, `Yeah bro you totally killed <@${(closestPlayer(p.args[1], p.game.players) || {}).id}>!`);
            p.player.roleData.finished = true;
        }
    },
};