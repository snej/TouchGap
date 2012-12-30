var auth = require("./auth"),
  config = require("./config"),
  // db = coux.prefix(config.dbUrl),
  // view = coux.prefix([config.dbUrl,"_design","wiki","_view","title"]),
  jsonform = require("./jsonform");

var last_seq = 0;
function getMessagesView(id, cb) {
  coux.get([config.dbUrl,"_design","threads","_view",
    "messages",{descending:true,
      startkey : [id,{}], endkey : [id]}], function(err, view) {

    if (!err && view.rows[0]) {
      last_seq = view.rows[0].key[1];
    }
    cb(err, view)
  });
}

exports.view = function(params) {
  var elem = $(this);
  auth.getUser(function(err, user) {
    if (err) {
      location.hash = "/reload";
      return;
    };

    // db.get(id, function() {});
    coux.get([config.dbUrl, params.id], function(err, thread) {
      if(err){return location.hash="/error";}
      console.log("thread", thread);

      function formSubmit(e) {
        e.preventDefault();
        var doc = jsonform(this);
        doc.author_id = user.user; // todo rename
        doc.created_at = doc.updated_at = new Date();
        doc.thread_id = thread._id;
        doc.seq = last_seq++;
        doc.type = "message";
        // emit([doc.thread_id, doc.seq, doc.updated_at], doc.text);
        console.log("message form", doc);
        coux.post(config.dbUrl, doc, function(err, ok){
          if (err) {return console.log(err);}
            drawMe()
          });
        return false;
      }

      // load view on changes
      function drawMe() {
        if (location.hash == "#/thread/"+thread._id) {
          getMessagesView(thread._id, function(err, view) {
            console.log("messages",err, view);
            if(err){return location.hash="/reload";}
            thread.rows = view.rows;
            elem.html(config.t.viewThread(thread));
            elem.find("form").submit(formSubmit);
          });
        } else {
          console.log("inactive draw for "+thread._id)
        }
      }

      coux.changes(config.dbUrl, drawMe);

      // unregister on switch channels
    });
  });
};

// sidebar
exports.index = function() {
  var elem = $(this);
  // console.log("list threads")
  // console.log("coux",[config.dbUrl,"_design","thread","_view","updated"].join('/'))
  coux.get([config.dbUrl,"_design","threads","_view","updated"], function(err, view) {
    view.rows.forEach(function(row){
      row.path = "/thread/"+row.id;
    });
    // console.log(err, view);
    elem.html(config.t.threadsIndex(view))
    elem.find(".new").click(function(){
      location.hash = "/threads/new";
    });
    elem.find('li a').click(function() {
      elem.find('ul li').removeClass("active");
      elem.parents("li").addClass("active");
    })
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
