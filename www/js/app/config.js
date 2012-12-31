var config = module.exports = {t : {}},
  mu = require("mustache");

config.dbHost = 'http://localhost.touchdb.';

config.channelServer = 'http://animal.local:3000/channels/';

config.syncTarget = 'animal.local:4984/basecouch';

if (location.protocol != "file:") {
  config.dbHost = location.origin;
}

config.dbName = "threads";

config.dbUrl = config.dbHost + '/' + config.dbName;

$('script[type="text/mustache"]').each(function() {
    var id = this.id.split('-');
    id.pop();
    module.exports.t[id.join('-')] = mu.compile(this.innerHTML.replace(/^\s+|\s+$/g,''));
});
