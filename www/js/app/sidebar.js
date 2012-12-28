var config = require("./config");
module.exports = function(route) {
  return {
    draw : function(cb) {
      coux.get([config.dbUrl,"_design","wiki","_view","title",
          {descending:true, limit:100}], function(err, view) {
          view.rows.forEach(function(row) {
              row.path = '#/wiki/'+row.id;
          });
          var st = $.mustache(config.t.sidebar, view);
          $('#sidebar').html(st);
          $("#sidebar input.new").click(function() {
              route.go("#/edit/_new");
          })
          if (cb) {
              cb(err, view);
          }
      });
    }
  }
};
