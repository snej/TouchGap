var config = module.exports = {
    t : {}, dbName : "threads",
    dbHost : 'http://localhost.touchdb.'
  },
  mu = require("mustache"),
  SYNC_HOST = "animal.local";

if (!SYNC_HOST) {
  console.log("please run with environment variable LAN_NAME=myhost.local");
  console.log("see www/js/app/config.js to change environment variables")
}

config.channelServer = 'http://'+SYNC_HOST+':3000/channels/';
config.syncTarget = SYNC_HOST+':4984/basecouch';

if (location.protocol != "file:") {
  config.dbHost = location.origin;
}

config.dbUrl = config.dbHost + '/' + config.dbName;

$('script[type="text/mustache"]').each(function() {
    var id = this.id.split('-');
    id.pop();
    module.exports.t[id.join('-')] = mu.compile(this.innerHTML.replace(/^\s+|\s+$/g,''));
});
