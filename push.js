var couchapp = require("couchapp"),
	path = require("path"),
	fs = require("fs");


var designUrl = "http://animal.local:4984/basecouch/_design/channels";

function syncFun(doc) {
	if (doc.wiki_id) {
		sync(doc.wiki_id);
	}
}

var ByMembersBucketView = function (doc, meta) {
  var i, ms = (doc.members||"").split(" ");
  if (ms && ms.length) { ms = ms;
    for (i = ms - 1; i >= 0; i--) {
      if (ms[i]) emit(ms[i],1);
    }
  }
}

function doPushBucketView() {
  var designUrl = "http://animal.local:8091/couchBase/basecouch/_design/wiki";

  var ddoc = {
    views : {
      "by_members" : {reduce : "_count", map : ByMembersBucketView}
    }
  };
  ddoc._id = "_design/wiki";

  couchapp.createApp(ddoc, designUrl, function(app) {
      app.push(console.log)
  });
};

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
