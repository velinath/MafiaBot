const ext = require('../lib/ext.js');

var factions = [];
require('fs').readdirSync(__dirname + '/').forEach(file => {
  if (file.match(/\.js$/) !== null && file !== 'index.js') {
    var faction = ext({}, require('./' + file)); // clone object first so we don't pollute the require cache
    for (var prop in faction) {
        if (typeof(faction[prop]) === 'function') {
            faction[prop] = faction[prop].bind(faction);
        }
    }
    factions.push(faction);
  }
});
module.exports = factions;