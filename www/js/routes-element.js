var routes = require("routes");

module.exports = function(table, element, bubbles) {
  var match = matcherForTable(table, element);
  $(window).bind('hashchange', function(){
    match(location.hash);
  });
  $(document.body).on("click", "a", function() {
    // if bubbles is == false, the #/hash won't change, useful for
    // state that doesn't need to be linkable or in the history
    if (match(this.href)) {
      return bubbles;
    }
  });
  return {
    init : function(path) {
      console.log("init", location.hash||path);
      match(location.hash||path||"/");
    },
    go : function(path) { // for non-linked state on widgets
      match(path);
    }
  }
};

function matcherForTable(table, element) {
  var router = new routes.Router();
  for (var path in table) {
    if (table[path]) {
      console.log("bind path", path);
      router.addRoute(path, function() {
        console.log("run", element, path, arguments, table[path])
        table[path].apply(element, arguments);
      }); // ensure this is the element
    }
  }
  return function(url) {
    var path = url.slice(url.indexOf('#')),
    console.log("try", path);
    matched = router.match(path);
    if (matched) {
      matched.fn(matched)
    }
    return matched;
  }
};



