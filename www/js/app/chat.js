var auth = require("./auth"),
  config = require("./config"),
  // db = coux.prefix(config.dbUrl),
  // view = coux.prefix([config.dbUrl,"_design","wiki","_view","title"]),

  jsonform = require("./jsonform");

exports.view = function(id) {
  console.log("view chat", id)
  // db.get(id, function() {});
  coux.get([config.dbUrl, id], function(err, chat) {
    console.log("chat", chat)
  });
};

exports.index = function() {
  console.log("list chats")
  coux.get([config.dbUrl,"_design","chat","_view","title"], function(err, view) {
    console.log(err, view);
  });
};


exports.create = function(params) {
  console.log("new chat", this, params)
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
      doc._id = doc.chat_id = Math.random().toString(20).slice(2);
      doc.type = "chat";
      // db.post(doc, function(err, ok) {});
      coux.post(config.dbUrl, doc, function(err, ok) {
        console.log(err, ok);
        location.hash = "/chat/"+ok.id;
      });
      return false;
    });
  });
};
