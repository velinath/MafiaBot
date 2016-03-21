module.exports = {
    id: 'vanilla',
    name: 'Vanilla',
    description: `You have no special abilities.`,
    isFinished: (p) => {
        return Boolean(p.player.roleData.noAction);
    },
    onNight: (p) => {
        p.player.roleData.noAction = false;
        p.mafiabot.sendMessage(_.find(p.mafiabot.users, {id: p.player.id}), `Use the ##noaction command to confirm that you are active but taking no action tonight.`);
    },
    onPMCommand: (p) => {
        if (p.game.state != STATE.NIGHT) {
            return;
        }
        if (p.args[0] == 'noaction') {
            p.player.roleData.noAction = true;
            p.mafiabot.reply(p.message, `You are taking no action tonight.`);
        }
    },
};