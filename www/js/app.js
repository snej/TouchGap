$(function() {
  var config = require('./app/config'),
    home = require("./app/home"),
    chat = require("./app/chat"),
    fastclick = require("fastclick"),
    router = require('director').Router;

  new fastclick.FastClick(document.body);

  var content = $("#content")[0],
    contentRoutes = {
      "/login" : home.login,
      "/reload" : location.reload,
      "/start" : home.start,
      "/chat/:id" : chat.view,
      "/" : function() {
        $(content).append('<li>/</li>')
      },
      "/bar" : function() {
        $(content).append('<li>/bar :/</li>')
      },
      "/ok" : function() {
        $(content).append('<li>/ok :)</li>')
      }
    },
    sidebar = $("#sidebar")[0],
    sidebarRoutes = {
      "/chats" : chat.index
    };

  // $(document.body).click(function() {
  //   $(content).append('<li>** clicked</li>')
  //   // return false;
  // })

  var contentRouter = router(contentRoutes, content);
  // // var sidebarRouter = router(sidebarRoutes, sidebar);
  // // var route = require('./route'),

  contentRouter.init("/start");

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

