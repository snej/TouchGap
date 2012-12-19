var couchapp = require("couchapp"),
	path = require("path"),
	fs = require("fs");


var designUrl = "http://animal.local:4984/channelsync/_design/channels";

function syncFun(doc) {
	if (doc.page_id) {
		sync(doc.page_id);
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
