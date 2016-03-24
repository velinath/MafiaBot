const templates = require('./templates');

var self = templates.extend(templates.noAction, {
    id: 'vanilla',
    name: 'Vanilla',
    description: `You have no special abilities.`,
});
module.exports = self;