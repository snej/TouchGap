$(function() {
  var config = require('./app/config'),
    home = require("./app/home"),
    thread = require("./app/thread"),
    auth = require('./app/auth'),
    sync = require('./app/sync'),
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
      "/" : home.index,
      // "/ready" : home.ready,
      "/threads/new" : thread.create,
      "/thread/:id" : thread.view

    },
    sidebar = $("#sidebar")[0],
    sidebarRoutes = {
      "/threads" : thread.index,
      "/thread/:id" : thread.index
    };

  function initSyncOrLogin (cb) {
    auth.getUser(function(no, user) {
      if (no) {
        location.hash="/login";
      } else {
        var resync = sync.trigger(user, function(err, ok) {
          if (err) {
            console.log("sync err", err);
            location.hash="/reload";
          } else {
            // ok
            console.log("init ok")
            cb(false, resync);
          }
        });
      }
    });
  }

  var changesSetup = false;
  function setupChanges(changesHandler) {
    if (changesSetup) return;
    changesSetup = true;
    coux(config.dbUrl, function(err, info){
      console.log("setup changes",info);
      coux.changes(config.dbUrl, info.update_seq, function(change) {
        console.log("changes",change);
        // trigger routes based on changes
        change.results.forEach(function(row){
          coux([config.dbUrl, row.id], function(err, doc){
            if (err) {
              console.log("changes doc err", err);
            } else {
              changesHandler(doc);
            }
          });

        });

      });
    });

  }
  // start the sync
  function appInit() {
    var contentRouter = router(contentRoutes, content);
    contentRouter.init();
    var sidebarRouter = router(sidebarRoutes, sidebar);
    sidebarRouter.init("/threads");
    touchlink(sidebar);
    initSyncOrLogin(function(err, resync){
      if (err) throw err;
      setupChanges(function(doc){
        console.log("change",location.hash, doc);
        var currentThread = location.hash.split('/').pop();
        if (doc.type == "message" && doc.thread_id == currentThread) {
          // redraw the chat
          console.log("chat redraw", currentThread)
          contentRouter.go(location.hash);
        } else if (doc.type = "thread") {
          console.log("new thread", doc)
          // redraw the sidebar
          sidebarRouter.go(location.hash)
          // get new channels from sync server
          resync();
        }
      });
    });

  }

  appInit();

});

