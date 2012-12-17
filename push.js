var couchapp = require("couchapp"),
	path = require("path"),
	fs = require("fs");


var designUrl = "http://animal.local:4984/channelsync/_design/channels";

function syncFun(doc) {
	var matches = doc._id.match(/(.*):.*/);
	if (matches && matches[1]) {
		sync(matches[1]);
	} else if (doc.type == "note") {
		sync(doc._id);
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
