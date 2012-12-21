var couchapp = require("couchapp"),
	path = require("path"),
	fs = require("fs");


var designUrl = "http://animal.local:4984/channelsync/_design/channels";

function syncFun(doc) {
	if (doc.wiki_id) {
		sync(doc.wiki_id);
	}
}

var CouchbaseServerMapFunction = function (doc, meta) {
  var i, ms = (doc.members||"").split(" ");
  if (ms && ms.length) { ms = ms;
    for (i = ms - 1; i >= 0; i--) {
      if (ms[i]) emit(ms[i],1);
    }
  }
}



function doPushApp() {
	var ddoc = {
		channelmap : syncFun
	};
	ddoc._id = "_design/channels";

	couchapp.createApp(ddoc, designUrl, function(app) {
	    app.push(console.log)
	});
};

doPushApp();
