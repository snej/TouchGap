/*jslint browser: true*/ /*global  $ Showdown console coux*/
/*
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 */

$(function(){
var touchDbHost = 'http://localhost.touchdb./',
        dbUrl = touchDbHost+'notes/',
        content = $("#content"),
        route = content.bindPath,
        currentNote = 'currentNote',
        newDocMarkdown = "",
        showdownConverter = new Showdown.converter(),
        t = {};

    if (location.protocol != "file:") {
        dbUrl = location.origin + "/notes/";
    }

    // gather templates
    $('script[type="text/mustache"]').each(function() {
        var id = this.id.split('-');
        id.pop();
        t[id.join('-')] = $(this).html();
    });

    // trigger replication
    coux.get(dbUrl, function(err, ok) {
        console.log("touchdb", err, ok);
        console.log("touchDbHost", touchDbHost)

        coux.post([touchDbHost, "_replicate"], {
            source : "http://animal.local:4984/channelsync",
            target : "notes",
            continuous : true,
            filter : "channelsync/bychannel",
            query_params : {
                channels : "5737529525067657"
            }
        },function(err, ok) {
            console.log("syncing down", err, ok)
        })
        coux.post([touchDbHost, "_replicate"], {
            target : "http://animal.local:4984/channelsync",
            source : "notes",
            continuous : true
        },function(err, ok) {
            console.log("syncing up", err, ok)
        })
    });

    coux.changes(dbUrl, function(err, changes) {
        console.log("change", err, changes);
        var matches = window.location.toString().match(/^[^#]*#(.+)$/);
        if (matches && matches[1] && !/edit/.test(matches[1])) {
            $.pathbinder.go(matches[1])
        }
    });

    function wikiToHtml(string) {
        if (!string) return "";
        var linkPrefix = "#/note/"+currentNote+'/';
        string = string.replace(/([A-Z][a-z]*[A-Z][A-Za-z]*)/gm, "[$1]("+linkPrefix+"$1)");
        string = string.replace(/\[\[(.*)\]\]/gm,"[$1]("+linkPrefix+"$1)");
        return showdownConverter.makeHtml(string);
    }

    function breadcrumbs_form(note, page) {
        var capture = "#/note";
            onNote = true,
            path = [note];
        console.log("breadcrumbs",{note:note, page:page})
        if (page) path.push(page);
        return path.map(function(row) {
            capture = capture + "/" + row[0];
            if (onNote) {
                onNote = false;
                return '<input type="text" name="title" value="'+row[1]+'"/>';
            }
            return '<a href="'+capture+'">'+row[1]+'</a>';
        }).join(' > ');
    }

    function breadcrumbs(note, page) {
        var capture = "#/note";
            path = [note];
        console.log("breadcrumbs",{note:note, page:page})
        if (page) path.push(page);
        return path.map(function(row) {
            if (!row) return null;
            capture = capture + "/" + row[0];
            return '<a href="'+capture+'">'+row[1]+'</a>';
        }).join(' > ');
    }

    function drawSidebar(cb) {
        coux.get([dbUrl,"_design","notes","_view","title",
            {descending:true, limit:100}], function(err, view) {
            view.rows.forEach(function(row) {
                row.path = '#/note/'+row.id;
            });
            var st = $.mustache(t.sidebar, view);
            $('#sidebar').html(st);
            $("#sidebar input").click(function() {
                $.pathbinder.go("#/edit/_new");
            })
            if (cb) {
                cb(err, view);
            }
        });
    };

    function drawPage(note, page, cb) {
        currentNote = note._id;
        var data = {
            body : wikiToHtml((page || note).markdown),
            tags : note.tags,
            members : note.members,
            note : note,
            page_id : (page ? page._id.split(':').pop() : null)
        };
        var st = $.mustache(t.note, data);
        $('#content').html(st);
        $('input.save').click(function() {
            var path = note._id;
            if (page) path += "/"+data.page_id;
            $.pathbinder.go("/edit/"+path);
        })
        if (cb) {cb()};
    };

    $('textarea').bind('focus',function(event){
        window.scrollTo(0, 0);
        document.body.scrollTop = 0;
    });
    $('textarea').bind('blur',function(event){
        window.scrollTo(0, 0);
        document.body.scrollTop = 0;
    });

    route("/home", function() {
        drawSidebar(function(err, view) {
            var id = view.rows[0].id;
            coux.get([dbUrl,id], function(err, doc) {
                drawPage(doc, null);
            });
        })
    });

    // read the front page of note
    route("/note/:id", function(e, params) {
        drawSidebar();
        currentNote = params.id;
        coux.get([dbUrl,params.id], function(err, doc) {
            if (err) {
                console.log("error", err);
                return;
            }
            drawPage(doc, null)
        });
    });

    // read any other page of a note
    route("/note/:id/:page", function(e, params) {
        drawSidebar();
        currentNote = params.id;
        coux.get([dbUrl,params.id], function(err, note) {
            if (!err) {
                coux.get([dbUrl,params.id+':'+params.page], function(err, page) {
                    if (!err) {
                        drawPage(note, page);
                    } else {
                        $.pathbinder.go("/edit/"+currentNote+'/'+params.page);
                    }
                });
            } else {
                $.pathbinder.go("/edit/"+currentNote);
            }
        });
    });


    // edit the front page of a note
    route("/edit/:id", function(e, params) {
        drawSidebar();
        var newNote = {
                _id : params.id == "_new" ? (""+Math.random()).slice(2) : params.id,
                created_at : new Date(),
                type : "note"
            };
        function withNote(err, note) {
            if (err) {
                note = newNote;
            }
            $('#content').html($.mustache(t['edit-note'], note));
            $('input.save').click(function() {
                $('#content form').submit();
            });
            $('#content form').submit(function(e) {
                e.preventDefault();
                note.title = $("[name=title]").val();
                note.markdown = $("textarea",this).val();
                note.tags = $("[name=tags]",this).val();
                note.members = $("[name=members]",this).val();
                note.updated_at = new Date();
                coux.put([dbUrl,note._id], note, function(err, ok) {
                    console.log("saved", err, ok);
                    if (!err) $.pathbinder.go("/note/"+params.id);
                });
            });
        }
        if (newNote.id == "_new") {
            console.log("_newNote",newNote);
            withNote(false, newNote);
        } else {
            console.log("get note");
            coux.get([dbUrl,params.id], withNote);
        }
    });


    function drawPageForm (page) {

    }
    // edit any other page of a note
    route("/edit/:id/:page", function(e, params) {
        currentNote = params.id;
        drawSidebar();
        coux.get([dbUrl,params.id], function(err, note) {
            if (!err) {
                coux.get([dbUrl,params.id+':'+params.page], function(err, page) {
                    if (err) {
                        page = {
                            _id : params.id+':'+params.page,
                            created_at : new Date(),
                            type : "page"
                        };
                    }
                    var data = {
                        markdown : page.markdown,
                        title : note.title,
                        page_id : params.page
                    };
                    $('#content').html($.mustache(t['edit-page'], data));
                    $('input.save').click(function() {
                        $('#content form').submit();
                    });
                    $('#content form').submit(function(e) {
                        e.preventDefault();
                        page.markdown = $("textarea", this).val();
                        note.updated_at = page.updated_at = new Date();
                        coux.put([dbUrl,page._id], page, function(err, ok) {
                            console.log("saved", err, ok);
                            $.pathbinder.go("/note/"+note._id+"/"+params.page);
                            coux.put([dbUrl, note._id], note, function() {});
                        });
                    });

                });
            } else {
                $.pathbinder.go("/edit/"+currentNote);
            }
        });
    });

    $.pathbinder.begin("/home");
});
