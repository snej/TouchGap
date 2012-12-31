var config = require('./config'),
  auth = require('./auth'),
  sync = require('./sync'),
  mu = require("mustache").render;

exports.reload = function() {
  location.hash="#/reloaded";
  // location.reload()
};
exports.reloaded = function() {
  location.hash="/";
};

exports.index = function() {
  // render index content html

}


