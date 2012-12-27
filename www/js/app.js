$(function() {
  var mustache = require('./mustache'),
    route = require('./route'),
    config = require('app/config'),
    auth = require('app/auth'),
    sync = require('app/sync'),
    wikis = require("app/wikis.js")(route);

  function pd(e) {e.preventDefault();}

  route("/login", function() {
    $('#content').html(mustache.render(config.t.login));
    $("#content form").submit(function(e) {
      pd(e);
      var me = $("input[type=text]",this).val(),
        pass = $("input[type=password]",this).val();
      auth.login({user : me, pass: pass}, function(err, ok) {
        if (err) throw err;
        $.pathbinder.go("/home"); // triggers initial sync
      });
    });
  });

  route("/home", function() {
    route("/home", function() {
      coux.get([dbUrl,"_design","wiki","_view","title",
          {descending:true, limit:1}], function(err, view) {
            var path  = "/wiki/" + (view.rows[0] && view.rows[0].id);
            console.log("redirect "+path);
            $.pathbinder.go(path);
        });
    });
  });

  $.pathbinder.begin("/home");
});

