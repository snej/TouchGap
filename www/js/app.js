$(function() {
  var mustache = require('./mustache'),
    config = require('./config'),
    auth = require('./auth'),
    sync = require('./sync'),
    route = require('./route');

    route("/login", function() {
      console.log("login!", mustache, config.t.login)
      $('#content').html(mustache.render(config.t.login));
      $("#content form").submit(function() {
        var me = $("input[type=text]",this).val(),
          pass = $("input[type=password]",this).val();
        auth.login({user : me, pass: pass}, function(err, ok) {
          if (err) throw err;
          $.pathbinder.go("/home"); // triggers initial sync
        });
        return false;
      });
    });

    $.pathbinder.begin("/home")
});



