var mods = {};
require('fs').readdirSync(__dirname + '/').forEach(file => {
  if (file.match(/\.js$/) !== null && file !== 'index.js') {
    var mod = require('./' + file);
    var id = mod.id;
    delete mod.id;
    mods[id] = mod;
  }
});
module.exports = mods;