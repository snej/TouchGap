var http = require('http');
var send = require('send');
var url = require('url');
var coux = require('coux');

var baseCouch = "http://localhost:4984";
var baseCouchAuth = "http://localhost:4985";

coux.put("http://localhost:4985/GUEST", {
  name: "GUEST", password : "GUEST",
  channels : []
}, function(err, ok) {
  if (err) {
    console.log("couldn't turn off GUEST access", err);
    process.exit(-1);
  }
});

function handleChannelsRequest(req, res) {

  // todo trigger this from changes
  function handleChannelBody(body) {
    var data = JSON.parse(body.toString()),
        baseCouchUserId = data.user,
        baseCouchData = {
          name : data.user,
          password : data.pass
        };
      // find channels with this user id:
      coux(["http://127.0.0.1:8092/channelsync/_design/wiki/_view/by_members",
          {group:true,connection_timeout:60000,
            start_key : [data.user], end_key : [data.user, {}]}],
        function(err, view) {
          var channelIds = view.rows.map(function(r) {return r.key[1]});
          res.statusCode = 200;
          console.log("channels", channelIds);
          baseCouchData.channels = channelIds;
          coux("http://localhost:4985/"+data.user, function(err, ok) {
            console.log("get", err, ok)
            if (err && ok.statusCode == 404) {
              // we can create a new user with this password
              coux.put("http://localhost:4985/"+data.user, baseCouchData, function(err, ok) {
                res.end(JSON.stringify(baseCouchData.channels));
              });
            } else if (!err) {
              // todo we should validate the password
              delete baseCouchData.password;
              // update the existing user with the new channels
              coux.put("http://localhost:4985/"+data.user, baseCouchData, function(err, ok) {
                res.end(JSON.stringify(baseCouchData.channels));
              });
            }
          });
        });
  }


  if (req.method != "POST") {
    res.statusCode = 406;
    res.end("POST required")
  }

  var chunk = "";
  req.on('data', function(data) {
    console.log("Received body data:");
    console.log(chunk += data.toString());
  });

  req.on('end', function() {
    // empty 200 OK response for now
    console.log(chunk)
    handleChannelBody(chunk)
  });

}

var app = http.createServer(function(req, res){
  // your custom error-handling logic:
  function error(err) {
    res.statusCode = err.status || 500;
    res.end(err.message);
  }
  var test
  var path = url.parse(req.url).pathname;
  console.log("GET", path)
  if (/^\/(notes|_replicate)/.test(path)) {
    var proxy = http.createClient(5984, 'localhost')
    var proxyRequest = proxy.request(req.method, req.url, req.headers);
    proxyRequest.on('response', function (proxyResponse) {
      proxyResponse.pipe(res);
    });
    req.pipe(proxyRequest);
  } else if (/^\/channels/.test(path)) {
    handleChannelsRequest(req, res);
  } else {
    res.setHeader("Access-Control-Allow-Origin","*");
    send(req, url.parse(req.url).pathname)
      .root(__dirname+'/www')
      .on('error', error)
      .pipe(res);
  }
}).listen(3000);
