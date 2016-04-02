const ext = require('../lib/ext.js');

var roles = [];
require('fs').readdirSync(__dirname + '/').forEach(file => {
  if (file.match(/\.js$/) !== null && file.indexOf('cop') >= 0 && file !== 'index.js') {
    var role = ext({}, require('./' + file)); // clone object first so we don't pollute the require cache
    for (var prop in role) {
        if (typeof(role[prop]) === 'function') {
            role[prop] = role[prop].bind(role);
        }
    }
    roles.push(role);
  }
});
module.exports = roles;