var factions = [];
require('fs').readdirSync(__dirname + '/').forEach(file => {
  if (file.match(/\.js$/) !== null && file !== 'index.js') {
    var faction = require('./' + file);
    for (var prop in faction) {
        if (typeof(faction[prop]) === 'function') {
            faction[prop] = faction[prop].bind(faction);
        }
    }
    factions.push(faction);
  }
});
module.exports = factions;