const _ = require('lodash');

var overrides = {};
if (global.DEBUG) {
    overrides = {
        nightActionReminderInterval: 15*1000,
        nightActionBufferTime: 1*1000,
    };
}
module.exports = _.merge({
    admins: [
        '88020438474567680', // fool
    ],
    feedbackFilePath: 'feedback.txt',
    dataJSONPath: 'data.json',
    rolesetJSONPath: 'rolesets.json',

    mainLoopInterval: 250,
    syncMessageTimeout: 2000,

    nightActionReminderInterval: 60*1000,
    nightActionBufferTime: 20*1000,
}, overrides);