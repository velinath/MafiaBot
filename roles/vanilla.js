const templates = require('./templates');
const ext = require('../lib/ext.js');

module.exports = ext(templates.noAction, {
    id: 'vanilla',
    name: 'Vanilla',
    description: `You have no special abilities.`,
});