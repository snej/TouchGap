var couchapp = require("couchapp"),
	path = require("path"),
	fs = require("fs");


var designUrl = "http://animal.local:4984/basecouch/_design/channels";
var bucketDesignUrl = "http://animal.local:8091/couchBase/basecouch/_design/threads";

function syncFun(doc) {
  var ch = doc.thread_id || doc.wiki_id;
	if (ch) {
		sync("ch-"+ch);
	}
  if (doc.members && doc.owner_id) {
    sync("threads-"+doc.owner_id);
    ms = doc.members.split(" ");
    for (i = ms.length - 1; i >= 0; i--) {
      if (ms[i]) {
        sync("threads-"+ms[i]);
      }
    }
  }
}

var ByMembersBucketView = function (doc, meta) {
  var i, ms, ch = doc.thread_id;// || doc.wiki_id;
  if (ch && doc.members) {
    ms = doc.members.split(" ");
    for (i = ms.length - 1; i >= 0; i--) {
      if (ms[i]) emit([ms[i], ch], doc.title);
    }
    if (doc.owner_id) {emit([doc.owner_id, ch], doc.title);}
  }
}

function doPushBucketView() {
  var ddoc = {
    views : {
      "by_members" : {reduce : "_count", map : ByMembersBucketView}
    }
  };
  ddoc._id = "_design/threads";

  couchapp.createApp(ddoc, bucketDesignUrl, function(app) {
      app.push(console.log)
  });
};

// basecouch sync function
// todo : validation function
function doPushApp() {
	var ddoc = {
		channelmap : syncFun
	};
	ddoc._id = "_design/channels";

	couchapp.createApp(ddoc, designUrl, function(app) {
	    app.push(console.log)
	});
};


exports.go = function() {
  doPushApp();
  doPushBucketView();
};
