const templates = require('./templates');

var self = templates.extend(templates.noAction, {
    id: 'godfather',
    name: 'Godfather',
    description: `You have no active abilities, but you get scanned as innocent by cops.`,
});
module.exports = self;