const _ = require('lodash');

var obj = {};
require('fs').readdirSync(__dirname + '/').forEach(file => {
  if (file.match(/\.js$/) !== null && file !== 'index.js') {
    var name = file.replace('.js', '');
    obj[name] = require('./' + file);
  }
});
module.exports = obj;