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
    view.rows.forEach(function(r) {
      if (r.value.photo) {
        r.value.path = "http://localhost.touchdb./threads/"+r.id+"/photo.jpg";
      }
    })
    cb(err, view)
  });
}

function makeNewPhotoClick(user) {
  if (navigator.camera.getPicture) {
    return function(e) {
      e.preventDefault();
      var form = this, doc = messageFromForm(user.user, form);
      coux.post(config.dbUrl, doc, function(err, ok) {
        navigator.camera.getPicture(function(picData){
          doc._id = ok.id;
          doc._rev = ok.rev;
          doc._attachments = {
            "photo.jpg" : {
              content_type : "image/jpg",
              data : picData
            }
          };
          coux.put([config.dbUrl, doc._id], doc, function(err, ok){
            if (err) {return console.log(err);}
            console.log("pic",ok)
            var input = $("form.message [name=text]");
            if (input.val() == doc.text) {
              input.val('');
            }
          });
        }, function(err){console.error("camera err",err)}, {
          quality : 25,
          destinationType: Camera.DestinationType.DATA_URL
        });
      });
    }
  } else {
    return function() {
      console.error("no navigator.camera.getPicture")
    };
  }
};

function messageFromForm(author_id, form) {
  var doc = jsonform(form);
  doc.author_id = author_id; // todo rename
  doc.created_at = doc.updated_at = new Date();
  doc.thread_id = $("section.thread ul").attr("data-thread_id");
  doc.seq = last_seq++;
  doc.type = "message";
  return doc;
};

function makeNewMessageBubbles(user) { // todo put author id in the dom
  console.log("makeNewMessageBubbles make", user.user);
return function(e) {
  e.preventDefault();
  var form = this, doc = messageFromForm(user.user, form);
  console.log("makeNewMessageBubbles", doc)
  if (!$(form).find("[name=_id]").val()) {
    console.log("makeNewMessageBubbles post", $(form).find("[name=_id]").val());

    // coux post doc, update dom with _id && _rev
    delete doc._id;
    delete doc._rev;
    coux.post(config.dbUrl, doc, function(err, ok){
      if (err) {return console.log(err);}
      console.log("made bubble", doc, ok.id);
      var input = $(form).find("[name=text]");
      if (input.val() == doc.text) {
        input.val('');
        $(form).find("[name=_id]").val(ok.id);
        $(form).find("[name=_rev]").val(ok.rev);
        console.log(form);
      }
    });
  }

};
}

function makeNewMessageSubmit(user) {
  return function(e) {
  e.preventDefault();
  var form = this, doc = messageFromForm(user.user, form);
  // emit([doc.thread_id, doc.seq, doc.updated_at], doc.text);
  console.log("makeNewMessageSubmit", form, $(form).find("[name=_id]").val());
  coux.post(config.dbUrl, doc, function(err, ok){
    if (err) {
      $(form).find("[name=_id]").val('');
      $(form).find("[name=_rev]").val('');
      return console.log(err);
    }
    console.log("makeNewMessageSubmit put",ok);
    var input = $(form).find("[name=text]");
    if (input.val() == doc.text) {
      input.val('');
      $(form).find("[name=_id]").val('');
      $(form).find("[name=_rev]").val('');
      console.log("makeNewMessageSubmit cleared",form);
    }
  });
}
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
      elem.find("form").submit(makeNewMessageSubmit(user));
      // elem.find("form input").on("focus", makeNewMessageBubbles(user));
      elem.find("form input").on("focus", function(e){
        var bbls = makeNewMessageBubbles(user);
        bbls.call(elem.find("form"), e)
      });
      console.log("bind to photo link")
      elem.find("a.photo").click(makeNewPhotoClick(user));
    }

    // db.get(id, function() {});
    coux.get([config.dbUrl, params.id], function(err, thread) {
      if(err){return location.hash="/error";}
      getMessagesView(thread._id, function(err, view) {
        if(err){return location.hash="/reload";}
        thread.rows = view.rows;
        // console.log(view.rows)
        $("section.thread").html(config.t.listMessages(thread));
      });
    });
  });
};

function drawSidebar(elem, active) {
  coux.get([config.dbUrl,"_design","threads","_view","updated"], function(err, view) {
    var activeOffset;
    view.rows.forEach(function(row, i){
      if (active && active._id == row.id) {
        row.active = active;
        activeOffset = i;
      }
      row.path = "/thread/"+row.id;
    });
    var activeRow = view.rows.splice(activeOffset, 1)[0];
    view.rows.unshift(activeRow);
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
}

// sidebar
exports.index = function(params) {
  var elem = $(this);
  if (params.id) {
    coux([config.dbUrl, params.id], function(err, doc){
      drawSidebar(elem, doc)
    });
  } else {
    drawSidebar(elem)
  }
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
    // is this event handler getting stuck on?
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
