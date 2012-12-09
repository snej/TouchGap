var http = require('http');
var send = require('send');
var url = require('url');

var app = http.createServer(function(req, res){
  // your custom error-handling logic:
  function error(err) {
    res.statusCode = err.status || 500;
    res.end(err.message);
  }
  var test
  var path = url.parse(req.url).pathname;
  console.log("GET", path)
  if (/^\/notes/.test(path)) {
    var proxy = http.createClient(5984, 'localhost')
    var proxyRequest = proxy.request(req.method, req.url, req.headers);
    proxyRequest.on('response', function (proxyResponse) {
      proxyResponse.pipe(res);
    });
    req.pipe(proxyRequest);
  } else {
    res.setHeader("Access-Control-Allow-Origin","*");
    send(req, url.parse(req.url).pathname)
      .root(__dirname+'/www')
      .on('error', error)
      .pipe(res);
  }
}).listen(3000);
