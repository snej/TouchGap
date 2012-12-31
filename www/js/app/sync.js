var config = require("./config");


var pullRep, pushRep,
  pullPath = [config.dbHost, "_replicator", "channel_pull-"+config.dbName],
  pushPath = [config.dbHost, "_replicator", "channel_push-"+config.dbName];

function refreshSyncDoc(path, rep, cb) {
  coux.get(path, function(err, ok) {
    if (err) {
      console.log("newdoc", err, path);
      // make a new doc
      coux.put(path, rep, cb);
    } else {
      // delete it and make a new doc
      var revpath = path.concat({rev:ok._rev})
      console.log("deleting revpath", revpath, rep);
      coux.del(revpath, function(err, ok) {
        if (err) {
          console.log("couldn't delete", err, revpath)
        }
        coux.put(path, rep, cb);
      })
    }
  });
}
function refreshSyncOnce(path, rep, cb) {
  var cancel = JSON.parse(JSON.stringify(rep));
  cancel.cancel = true;
  coux.post([config.dbHost, "_replicate"], cancel, function() {
    coux.post([config.dbHost, "_replicate"], rep, cb)
  })
}
function refreshPush() {
  var doSync = false ? refreshSyncDoc : refreshSyncOnce;
  doSync(pushPath, pushRep, function(err, ok) {
    console.log("pushRep", err, ok)
  })
}
function refreshPull() {
  var doSync = false ? refreshSyncDoc : refreshSyncOnce;
  doSync(pullPath, pullRep, function(err, ok) {
    console.log("pullRep", err, ok)
  })
}
function syncTheseChannels(user, channels) {
  if (!(channels && channels.length)) return;
    pullRep = {
      source : "http://"+user.user+":"+user.pass+"@"+config.syncTarget,
      target : config.dbName,
      continuous : true,
      filter : "basecouch/bychannel",
      query_params : {
          channels : channels.join(',')
      }
    };
    pushRep = {
        target : "http://"+user.user+":"+user.pass+"@"+config.syncTarget,
        source : config.dbName,
        continuous : true
    };
    refreshPush()
    refreshPull()
}


var syncInterval = false;
function syncForUser(userDoc, cb) {
  if (!syncInterval) {
    syncInterval = setInterval(function() {
      syncForUser(userDoc);
    },10000);
  }

  // console.log("syncForUser", userDoc.user);
                            // silly cache
  coux.post(config.channelServer+'?r='+Math.random(), userDoc, function(err, channels) {
      if (err) console.log("ch err", err);
      console.log(["channels", channels]);
      if (cb) {cb(err, channels);}
      // if the channels have changed from the old channels, run this
      syncTheseChannels(userDoc, channels);
  });
};

exports.trigger = syncForUser;


