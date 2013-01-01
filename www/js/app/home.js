var config = require('./config');

exports.reload = function() {
  location.hash="#/reloaded";
  // location.reload()
};
exports.reloaded = function() {
  location.hash="/";
};

exports.index = function() {
  // render index content html
  var elem = $(this);
  elem.html(config.t.index())
}


