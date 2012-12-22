/*jslint browser: true*/ /*global  $ Showdown console coux*/
/*
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 */

$(function(){
    var touchDbHost = 'http://localhost.touchdb.',
        BaseCouchUrl = 'animal.local:4984/basecouch',
        SyncServerPath = 'http://animal.local:3000/channels/';
    if (location.protocol != "file:") {
        touchDbHost = location.origin;
    }

    var dbUrl = touchDbHost+'/wiki/',
        content = $("#content"),
        route = content.bindPath,
        currentWiki = 'currentWiki',
        newDocMarkdown = "",
        showdownConverter = new Showdown.converter(),
        t = {}; //templates

    // gather templates
    $('script[type="text/mustache"]').each(function() {
        var id = this.id.split('-');
        id.pop();
        t[id.join('-')] = $(this).html();
    });

    var pullRep, pushRep,
      pullPath = [touchDbHost, "_replicator", "channel_pull"],
      pushPath = [touchDbHost, "_replicator", "channel_push"];

    function refreshSyncDoc(path, rep, cb) {
      coux.get(path, function(err, ok) {
        if (err) {
          console.log("newdoc", err, path);
          // make a new doc
          coux.put(path, rep, cb);
        } else {
          // delete it and make a new doc
          var revpath = path.concat({rev:ok._rev})
          console.log("deleting revpath", revpath);
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
      coux.post([touchDbHost, "_replicate"], cancel, function() {
        coux.post([touchDbHost, "_replicate"], rep, cb)
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
        pullRep = {
          source : "http://"+user.user+":"+user.pass+"@"+BaseCouchUrl,
          target : "wiki",
          continuous : true,
          filter : "basecouch/bychannel",
          query_params : {
              channels : channels.join(',')
          }
        };
        pushRep = {
            target : "http://"+user.user+":"+user.pass+"@"+BaseCouchUrl,
            source : "wiki",
            continuous : true
        };
        refreshPush()
        refreshPull()
    }

    coux.changes(dbUrl, function(err, changes) {
        console.log("change", err, changes);
        var matches = window.location.toString().match(/^[^#]*#(.+)$/);
        if (matches && matches[1] && !/edit/.test(matches[1])) {
            $.pathbinder.go(matches[1])
        }
    });

    function wikiToHtml(string) {
        if (!string) return "";
        var linkPrefix = "#/wiki/"+currentWiki+'/';
        string = string.replace(/([A-Z][a-z]*[A-Z][A-Za-z]*)/gm, "[$1]("+linkPrefix+"$1)");
        string = string.replace(/\[\[(.*)\]\]/gm,"[$1]("+linkPrefix+"$1)");
        return showdownConverter.makeHtml(string);
    }



    function drawSidebar(cb) {
        coux.get([dbUrl,"_design","wiki","_view","title",
            {descending:true, limit:100}], function(err, view) {
            view.rows.forEach(function(row) {
                row.path = '#/wiki/'+row.id;
            });
            var st = $.mustache(t.sidebar, view);
            $('#sidebar').html(st);
            $("#sidebar input.new").click(function() {
                $.pathbinder.go("#/edit/_new");
            })
            if (cb) {
                cb(err, view);
            }
        });
    };

    function drawPage(wiki, page, cb) {
        currentWiki = wiki._id;
        var data = {
            body : wikiToHtml((page || wiki).markdown),
            tags : wiki.tags,
            title : wiki.title,
            members : wiki.members,
            wiki_id : currentWiki,
            page_id : (page ? page._id.split(':').pop() : null)
        };
        var st = $.mustache(t.wiki, data);
        $('#content').html(st);
        $('input.save').click(function() {
            var path = wiki._id;
            if (page) path += "/"+data.page_id;
            $.pathbinder.go("/edit/"+path);
        })
        if (cb) {cb()};
    };

    $('body').bind('focus',function(event){
        window.scrollTo(0, 0);
        document.body.scrollTop = 0;
    });
    $('body').bind('blur',function(event){
        window.scrollTo(0, 0);
        document.body.scrollTop = 0;
    });

    route("/home", function() {
      coux.get([dbUrl,"_design","wiki","_view","title",
          {descending:true, limit:1}], function(err, view) {
            var id = view.rows[0] && view.rows[0].id;
            $.pathbinder.go("/wiki/"+id);
        });
    });

    var syncInterval = false;
    function syncForUser(userDoc, cb) {
      if (!syncInterval) {
        syncInterval = setInterval(function() {
          syncForUser(LocalUserDoc);
        },10000);
      }

      console.log("syncForUser", userDoc);
                                // silly cache
      coux.post(SyncServerPath+'?r='+Math.random(), userDoc, function(err, channels) {
          if (err) console.log("ch err", err);
          console.log("channels", channels);
          if (cb) {cb(err, channels);}
          syncTheseChannels(userDoc, channels);
      });
    };

    route("/login", function() {
      $('#content').html($.mustache(t['login']));
      $("#content form").submit(function() {
        var me = $("input[type=text]",this).val(),
          pass = $("input[type=password]",this).val(),
          localUser = {user : me, pass: pass};
        console.log("localUser "+me);
        syncForUser(localUser, function(err, ok) {
          if (!err) {
            saveLocalUser(localUser, function(err, ok) {
              LocalUserName = localUser.user;
              $.pathbinder.go("/home");
            });
          } else {
            console.log("error syncing", err);
            console.log(err);}
        });
        return false;
      });
    });

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


    // edit the front page of a wiki
    route("/edit/:id", function(e, params) {
        drawSidebar();
        var newWiki = {
                _id : params.id == "_new" ? (""+Math.random()).slice(2) : params.id,
                created_at : new Date(),
                members : LocalUserName,
                type : "wiki"
            };
        newWiki.wiki_id = newWiki._id;
        function withWiki(err, wiki) {
            if (err) {
                console.log("withWiki", err)
                wiki = newWiki;
            }
            console.log("edit form");
            $('#content').html($.mustache(t['edit-wiki'], wiki));
            $('input.save').click(function() {
                $('#content form').submit();
            });
            $('#content form').submit(function(e) {
                e.preventDefault();
                wiki.title = $("[name=title]").val();
                wiki.markdown = $("textarea",this).val();
                wiki.tags = $("[name=tags]",this).val();
                wiki.members = $("[name=members]",this).val();
                wiki.updated_at = new Date();
                coux.put([dbUrl,wiki._id], wiki, function(err, ok) {
                    console.log("saved", err, ok);
                    if (!err) $.pathbinder.go("/wiki/"+wiki._id);
                });
            });
        }
        if (params.id == "_new") {
            console.log("_newWiki",newWiki);
            withWiki(false, newWiki);
        } else {
            console.log("get wiki");
            coux.get([dbUrl,params.id], withWiki);
        }
    });


    function editNestedPage (page) {

    }
    // edit any other page of a wiki
    route("/edit/:id/:page", function(e, params) {
        currentWiki = params.id;
        drawSidebar();
        coux.get([dbUrl,params.id], function(err, wiki) {
            if (!err) {
                coux.get([dbUrl,params.id+':'+params.page], function(err, page) {
                    if (err) {
                        page = {
                            _id : params.id+':'+params.page,
                            created_at : new Date(),
                            type : "page",
                            wiki_id : params.id
                        };
                    }
                    var data = {
                        markdown : page.markdown,
                        title : wiki.title,
                        wiki_id : params.id,
                        page_id : params.page
                    };
                    $('#content').html($.mustache(t['edit-page'], data));
                    $('input.save').click(function() {
                        $('#content form').submit();
                    });
                    $('#content form').submit(function(e) {
                        e.preventDefault();
                        page.markdown = $("textarea", this).val();
                        wiki.updated_at = page.updated_at = new Date();
                        coux.put([dbUrl,page._id], page, function(err, ok) {
                            console.log("saved", err, ok);
                            $.pathbinder.go("/wiki/"+wiki._id+"/"+params.page);
                            coux.put([dbUrl, wiki._id], wiki, function() {});
                        });
                    });

                });
            } else {
                $.pathbinder.go("/edit/"+currentWiki);
            }
        });
    });

    function getLocalUser(cb) {
      coux([dbUrl, "_local/user"], cb);
    };

    function saveLocalUser(doc, cb) {
      coux.put([dbUrl, "_local/user"], doc, cb);
    }

    function startApp() {
      // get the _local login doc
      // if (ever) logged in, go home, else go to login
      console.log("Starting App at "+dbUrl);
      getLocalUser(function(err, localUser) {
        if (err) {
          $.pathbinder.go("/login");
        } else {
          LocalUserDoc = localUser;
          LocalUserName = localUser.user;
          syncForUser(LocalUserDoc);
          $.pathbinder.go("/home");
        }
      });
    };
    var LocalUserName, LocalUserDoc;
    startApp();

});
