const ext = require('../lib/ext.js');

var roles = [];
require('fs').readdirSync(__dirname + '/').forEach(file => {
  if (file.match(/\.js$/) !== null && file !== 'index.js') {
    var items = [{}, require('./' + file)];
    var role = ext(...items); // clone object first so we don't pollute the require cache + use the spread operator to prevent a weird debug-only crash
    for (var prop in role) {
        if (typeof(role[prop]) === 'function') {
            role[prop] = role[prop].bind(role);
        }
    }
    roles.push(role);
  }
});
module.exports = roles;