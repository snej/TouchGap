var config = require("./config");

exports.setUser = function(user, cb) {
  coux.put([config.dbUrl, "_local/user"], user, cb);
};

exports.getUser = function(cb) {
  coux([config.dbUrl, "_local/user"], cb);
};

var auth = exports;
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
