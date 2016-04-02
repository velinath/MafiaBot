const templates = require('./templates');
const ext = require('../lib/ext.js');

module.exports = ext(templates.noAction, {
    id: 'godfather',
    name: 'Godfather',
    description: `You have no active abilities, but you get scanned as innocent by cops.`,
});