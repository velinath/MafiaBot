var roles = [];
require('fs').readdirSync(__dirname + '/').forEach(file => {
  if (file.match(/\.js$/) !== null && file !== 'index.js') {
    var role = require('./' + file);
    for (var prop in role) {
        if (typeof(role[prop]) === 'function') {
            role[prop] = role[prop].bind(role);
        }
    }
    roles.push(role);
  }
});
module.exports = roles;