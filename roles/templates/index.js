const _ = require('lodash');

var obj = {
    extend: (template, extensions) => {
        var template = template(extensions);
        var final = _.assignIn({}, template, extensions);
        final.template = template;
        return final;
    }
};
require('fs').readdirSync(__dirname + '/').forEach(file => {
  if (file.match(/\.js$/) !== null && file !== 'index.js') {
    var name = file.replace('.js', '');
    obj[name] = require('./' + file);
  }
});
module.exports = obj;