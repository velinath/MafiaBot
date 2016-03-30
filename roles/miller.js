const templates = require('./templates');

var self = templates.extend(templates.noAction, {
    id: 'miller',
    name: 'Miller',
    description: `You have no active abilities, but you get scanned as scum by cops.`,
});
module.exports = self;