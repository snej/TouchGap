$(function() {
  var route = require('./route'),
    // config = require('./app/config'),
    auth = require('./app/auth'),
    // sync = require('./app/sync'),
    // register controllers
    home = require("./app/home")(route),
    wikis = require("./app/wikis")(route),
    edits = require("./app/edits")(route),
    sidebar = require("./app/sidebar")(route);

  home.ready();

});

