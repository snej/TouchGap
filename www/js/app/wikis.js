module.exports = function(route) {
  // read the front page of wiki
  route("/wiki/:id", function(e, params) {
      drawSidebar();
      currentWiki = params.id;
      coux.get([dbUrl,params.id], function(err, doc) {
          if (err) {
              console.log("error", err);
              return;
          }
          drawPage(doc, null)
      });
  });

  // read any other page of a wiki
  route("/wiki/:id/:page", function(e, params) {
      drawSidebar();
      currentWiki = params.id;
      coux.get([dbUrl,params.id], function(err, wiki) {
          if (!err) {
              coux.get([dbUrl,params.id+':'+params.page], function(err, page) {
                  if (!err) {
                      drawPage(wiki, page);
                  } else {
                      $.pathbinder.go("/edit/"+currentWiki+'/'+params.page);
                  }
              });
          } else {
              $.pathbinder.go("/edit/"+currentWiki);
          }
      });
  });
};
