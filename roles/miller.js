const templates = require('./templates');
const ext = require('../lib/ext.js');

module.exports = ext(templates.noAction, {
    id: 'miller',
    name: 'Miller',
    description: `You have no active abilities, but you get scanned as scum by cops.`,
});