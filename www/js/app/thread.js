var auth = require("./auth"),
  config = require("./config"),
  // db = coux.prefix(config.dbUrl),
  // view = coux.prefix([config.dbUrl,"_design","wiki","_view","title"]),

  jsonform = require("./jsonform");

exports.view = function(params) {
  var elem = $(this);
  // db.get(id, function() {});
  coux.get([config.dbUrl, params.id], function(err, thread) {
    console.log("thread", thread)
    elem.html(config.t.viewThread(thread));
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
  var elem = $(this);

  auth.getUser(function(err, user) {
    if (err) {
      location.hash = "/reload";
      return;
    };
    elem.html(config.t.newThread(user));
    elem.find("form").submit(function(e) {
      e.preventDefault();
      var doc = jsonform(this);
      doc.owner_id = user.user; // todo rename
      doc.created_at = doc.updated_at = new Date();
      doc._id = doc.thread_id = Math.random().toString(20).slice(2);
      doc.type = "thread";
      // db.post(doc, function(err, ok) {}); todo
      coux.post(config.dbUrl, doc, function(err, ok) {
        console.log(err, ok);
        location.hash = "/thread/"+ok.id;
      });
      return false;
    });
  });
};
