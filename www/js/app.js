$(function() {
  var config = require('./app/config'),
    home = require("./app/home"),
    thread = require("./app/thread"),
    auth = require('./app/auth'),

    // libraries
    touchlink = require("./touchlink"),
    fastclick = require("fastclick"),
    router = require("./routes-element");
    // router = require('director').Router;

  new fastclick.FastClick(document.body);

  var content = $("#content")[0],
    contentRoutes = {
      "/login" : auth.login,
      "/reload" : home.reload,
      "/reloaded" : home.reloaded,
      "/" : home.ready,
      // "/ready" : home.ready,
      "/threads/new" : thread.create,
      "/thread/:id" : thread.view

    },
    sidebar = $("#sidebar")[0],
    sidebarRoutes = {
      "/threads" : thread.index
      // "/users" : users.index
    };

  touchlink(sidebar);

  var contentRouter = router(contentRoutes, content);
  contentRouter.init();
  var sidebarRouter = router(sidebarRoutes, sidebar);
  sidebarRouter.go("/threads");

});

