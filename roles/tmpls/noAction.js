const _ = require('lodash');
const STATE = require('../../lib/gameStates.js');

module.exports = {
    isFinished: function(p) {
        return Boolean(p.player.roleData.noAction);
    },
    onNight: function(p) {
        p.player.roleData.noAction = false;
        p.mafiabot.sendMessage(_.find(p.mafiabot.users, {id: p.player.id}), `Use the ***${pre}noaction*** command to confirm that you are active but taking no action tonight.`);
    },
    onPMCommand: function(p) {
        if (p.game.state != STATE.NIGHT) {
            return;
        }
        if (p.args[0] == 'noaction') {
            p.player.roleData.noAction = true;
            p.mafiabot.reply(p.message, `**You are taking no action tonight.**`);
        }
    },
};