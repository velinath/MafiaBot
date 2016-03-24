const _ = require('lodash');

var overrides = {};
if (global.DEBUG) {
    overrides = {
        minimumPlayers: 1,     
        nightActionBufferTime: 1*1000,   
    };
}
module.exports = _.merge({
    admins: [
        '88020438474567680', // fool
    ],
    feedbackFilePath: 'feedback.txt',

    mainLoopInterval: 250,
    syncMessageTimeout: 2000,

    minimumPlayers: 3,
    nightActionBufferTime: 20*1000,
}, overrides);