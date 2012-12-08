/*jslint browser: true*/ /*global  $ Showdown console coux*/
/*
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 */

$(function(){
    var touchDbUrl = 'http://localhost.touchdb./notes/',
        content = $("#content"),
        route = content.bindPath,
        currentNote = 'currentNote',
        newDocMarkdown = "Article content goes here. " +
            "Link to create new pages like this: [[New Page]]", 
        showdownConverter = new Showdown.converter(),
        t = {};

    // gather templates
    $('script[type="text/mustache"]').each(function() {
        var id = this.id.split('-');
        id.pop();
        t[id.join('-')] = $(this).html();
    });

    coux.get(touchDbUrl, function(err, ok) {
        console.log("touchdb", ok, err);
    });

    console.log("templates", t);

    function wikiToHtml(string) {
        var linkPrefix = "#/note/"+currentNote+'/';
        return showdownConverter.makeHtml(string.replace(/\[\[(.*)\]\]/gm,"[$1]("+linkPrefix+"$1)"));
    }

    function nav(want) {
        console.log("nav show", want);
        $("#pagenav a").hide();
        $("#pagenav a."+want).show();
    }

    function breadcrumbs(list) {
        var capture = "#/note",
            links = list.map(function(row) {
                capture = capture + "/" + row;
                return '<a href="'+capture+'">'+row+'</a>';
            }).join(' > ');
        $("#breadcrumbs").html(links);
    }

    route("/home", function() {
        nav("new");
        coux.get([touchDbUrl,"_design","notes","_view","title"], function(err, view) {
            console.log("view", view);
            view.rows.forEach(function(row) {
                row.path = '#/note/'+row.id;
            });
            var st = $.mustache(t.index, view);
            console.log("st", st);
            $('#content').html(st);
        });
    });


    route("/new", function(e, params) {
        nav("home");
        $('#content').html(t['new']);
        $('.new-form').submit(function(e) {
            e.preventDefault();
            var doc = {
                _id : (""+Math.random()).slice(2),
                created_at : new Date(),
                title : $("[name=title]", this).val(),
                tags : $("[name=tags]", this).val(),
                members : $("[name=share]", this).val(),
                markdown : newDocMarkdown
            };
            coux.put([touchDbUrl,doc._id], doc, function(err, ok) {
                console.log("put",err,ok);
                $.pathbinder.go("#/note/"+ok.id);
            });
        });
    });

    // read the front page of note
    route("/note/:id", function(e, params) {
        currentNote = params.id;
        nav("home");
        breadcrumbs([params.id]);
        $("#pagenav a.edit").attr({href:"#/edit/"+currentNote}).show();

        console.log("note",params.id);
        coux.get([touchDbUrl,params.id], function(err, doc) {
            doc.body = wikiToHtml(doc.markdown);
            console.log($.mustache(t.note, doc), doc, err);
            $('#content').html($.mustache(t.note, doc));
        });
    });

    // read any other page of a note
    route("/note/:id/:page", function(e, params) {
        // load up the app
        currentNote = params.id;
        console.log("/note/:id/:page", params);
        nav("home");
        breadcrumbs([params.id, params.page]);
        $("#pagenav a.edit").attr({href:"#/edit/"+currentNote+'/'+params.page}).show();

        $('#content').html($.mustache(t.edit, {
            title : params.page
        }));
    });


    // edit the front page of a note
    route("/edit/:id", function(e, params) {
        console.log("edit", params.id)
        coux.get([touchDbUrl,params.id], function(err, doc) {
            $('#content').html($.mustache(t.edit, doc));
            $('#content form').submit(function(e) {
                e.preventDefault();
                doc.body = $("textarea",this).val();
                coux.put([touchDbUrl,params.id], doc, function(err, ok) {
                    console.log("saved", err, ok)
                });
            });
        });
    });
    
    // edit any other page of a note
    route("/edit/:id/:page", function() {

    });

    $.pathbinder.begin("/home");
});
