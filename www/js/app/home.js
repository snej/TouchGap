var config = require('./config'),
  auth = require('./auth'),
  sync = require('./sync'),
  mu = require("mustache").render;

exports.reload = function() {
  location.hash="#/reloaded";
  // location.reload()
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


