var auth = require("./auth"),
  config = require("./config"),
  // db = coux.prefix(config.dbUrl),
  // view = coux.prefix([config.dbUrl,"_design","wiki","_view","title"]),

  jsonform = require("./jsonform");

exports.view = function(id) {
  console.log("view thread", id)
  // db.get(id, function() {});
  coux.get([config.dbUrl, id], function(err, thread) {
    console.log("thread", thread)
  });
};

exports.index = function() {
  console.log("list threads")
  coux.get([config.dbUrl,"_design","thread","_view","title"], function(err, view) {
    console.log(err, view);
  });
};


exports.create = function(params) {
  console.log("new thread", this, params)
  auth.getUser(function(err, user) {
    if (err) {
      location.hash = "/reload";
      return;
    };
    $("#content").html(config.t.newChat(user));
    $("#content form").submit(function(e) {
      e.preventDefault();
      var doc = jsonform(this);
      doc.created_at = doc.updated_at = new Date();
      doc._id = doc.thread_id = Math.random().toString(20).slice(2);
      doc.type = "thread";
      // db.post(doc, function(err, ok) {});
      coux.post(config.dbUrl, doc, function(err, ok) {
        console.log(err, ok);
        location.hash = "/thread/"+ok.id;
      });
      return false;
    });
  });
};
