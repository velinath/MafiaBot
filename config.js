const _ = require('lodash');

var overrides = {};
if (global.DEBUG) {
    overrides = {
    confirmingReminderInterval: 5*1000,
        nightActionReminderInterval: 15*1000,
        nightActionBufferTime: 1*1000,
    };
}
module.exports = _.merge({
    admins: [
        '88020438474567680', // fool
    ],
    feedbackFilePath: 'data/feedback.txt',
    dataJSONPath: 'data/data.json',
    rolesetJSONPath: 'data/rolesets.json',

    mainLoopInterval: 250,
    syncMessageTimeout: 2000,

    confirmingReminderInterval: 20*1000,
    nightActionReminderInterval: 60*1000,
    nightActionBufferTime: 20*1000,
}, overrides);