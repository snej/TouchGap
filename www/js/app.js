$(function() {
  var config = require('./app/config'),
    home = require("./app/home"),
    chat = require("./app/chat"),

    // libraries
    touchlink = require("./touchlink"),
    fastclick = require("fastclick"),
    router = require("./routes-element");
    // router = require('director').Router;

  new fastclick.FastClick(document.body);

  var content = $("#content")[0],
    contentRoutes = {
      "/login" : home.login,
      "/reload" : home.reload,
      "/" : home.start,
      // "/chats/new" : chat.create
      "/chat/:id" : chat.view

    },
    sidebar = $("#sidebar")[0],
    sidebarRoutes = {
      "/chats" : chat.index
    };

  touchlink(sidebar);

  var contentRouter = router(contentRoutes, content);
  contentRouter.init();
  console.log("contentRouter", contentRouter)
  // // var sidebarRouter = router(sidebarRoutes, sidebar);



  //   auth = require('./app/auth'),
  //   // sync = require('./app/sync'),
  //   // register controllers
  //   home = require("./app/home")(route),
  //   wikis = require("./app/wikis")(route),
  //   edits = require("./app/edits")(route),
  //   sidebar = require("./app/sidebar")(route);

  // home.ready();
  // sidebar.draw();

  // coux.changes(config.dbUrl, function(err, changes) {
  //     console.log("change", err, changes);
  //     sidebar.draw();

  //     var matches = window.location.toString().match(/^[^#]*#(.+)$/);
  //     if (matches && matches[1] && !/edit/.test(matches[1])) {
  //         route.go(matches[1])
  //     }
  // });

});

