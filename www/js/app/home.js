var config = require('./config'),
  auth = require('./auth'),
  sync = require('./sync'),
  mu = require("mustache").render;

exports.reload = function() {
  location.hash="#/reloaded";
  location.reload()
};
exports.reloaded = function() {
  location.hash="/";
};

exports.ready = function() {
    auth.getUser(function(no, user) {
      if (no) {
        location.hash="/login";
      } else {
        sync.trigger(user, function(err, ok) {
          if (err) {
            console.log("sync err", err);
            location.hash="/reset";
          } else {
            location.hash="/";
          }
        });
      }
    });
  }

// exports.home = function(){
//   mostRecentThread(function(err, thread) {
//     location.hash="/thread/"+thread._id;
//   });
// };

// module.exports = function(route) {
//   route("/home", function() {
//     // redirect to most recently updated wiki
//     coux.get([config.dbUrl,"_design","wiki","_view","title",
//       {descending:true, limit:1}], function(err, view) {
//         var id = (view.rows[0] && view.rows[0].id), path  = "/wiki/" + id;
//         if (id) {
//           console.log("redirect "+path);
//           route.go(path);
//         } else {
//           // no wikis, need to make a new one
//           route.go("/edit/_new");
//         }
//     });
//   });

  exports.login = function() {
    auth.getUser(function(no, user) {
      if (!no) {
        location.hash = "/";
      } else {
        $('#content').html(config.t.login({}));
        $("#content form").submit(function(e) {
          e.preventDefault();
          var me = $("input[type=text]",this).val(),
            pass = $("input[type=password]",this).val();
          auth.setUser({user : me, pass: pass}, function(err, ok) {
            // if (err) throw err;
            // ready(); // triggers initial sync
            location.hash = "/"
          });
        });
      }
    })
  };


//   return {ready:ready};
// };

