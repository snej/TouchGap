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

function newMessageSubmit(e) {
  e.preventDefault();
  var form = this, doc = jsonform(form);
  doc.author_id = user.user; // todo rename
  doc.created_at = doc.updated_at = new Date();
  doc.thread_id = $("section.thread ul").attr("data-thread_id");
  doc.seq = last_seq++;
  doc.type = "message";
  // emit([doc.thread_id, doc.seq, doc.updated_at], doc.text);
  console.log("new message", doc);
  coux.post(config.dbUrl, doc, function(err, ok){
    if (err) {return console.log(err);}
    var input = $(form).find("[name=text]");
    if (input.val() != doc.text) {
      console.log("you've been working", input.val());
    } else {
      input.val('');
    }
  });
}

function setupChanges(thread) {
  coux.changes(config.dbUrl, function() {
    if (location.hash == "#/thread/"+thread._id) {
      getMessagesView(thread._id, function(err, view) {
        console.log("messages",err, view);
        if(err){return location.hash="/reload";}
        thread.rows = view.rows;
        // target a ul? add content around list?
        $("section.thread").html(config.t.listMessages(thread));
      });
    } else {
      console.log("inactive draw for "+thread._id)
    }
  });
}

exports.view = function(params) {
  var elem = $(this);
  auth.getUser(function(err, user) {
    if (err) {
      location.hash = "/reload";
      return;
    };
    // if we aren't in thread mode, go there
    if (!elem.find('form.message')[0]) {
      elem.html(config.t.threadMode());
      elem.find("form").submit(newMessageSubmit);
    }

    // db.get(id, function() {});
    coux.get([config.dbUrl, params.id], function(err, thread) {
      if(err){return location.hash="/error";}
      console.log("thread", thread);


      setupChanges(thread);
      // setup the changes handler for this thread
      // and run it. todo unregister old thread.
    });
  });
};

// sidebar
exports.index = function(params) {
  if (params.id) console.log("params.id", params.id);
  var elem = $(this);
  // console.log("list threads")
  // console.log("coux",[config.dbUrl,"_design","thread","_view","updated"].join('/'))
  coux.get([config.dbUrl,"_design","threads","_view","updated"], function(err, view) {
    view.rows.forEach(function(row){
      row.path = "/thread/"+row.id;
    });
    // console.log(err, view);
    elem.html(config.t.threadsSidebar(view))
    elem.find(".new").click(function(){
      location.hash = "/threads/new";
    });
    elem.find('li a').click(function() {
      elem.find('ul li').removeClass("active");
      $(this).parents("li").addClass("active");
    });
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
