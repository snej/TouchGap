/*
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 */

var templates;

$(function(){
    var touchDbUrl = 'http://localhost.touchdb./notes/';
    helloNotes(touchDbUrl);
});

function getDoc(id, cb) {
    cb(true)
}


function helloNotes(touchDbUrl) {
    var content = $("#content"),
        t = {
            notes : $("#notes-mu").html(),
            edit : $("#edit-mu").html()
        };

    coux(touchDbUrl, function(err, ok) {
        console.log(err, ok)
    })


    var showdownConverter = new Showdown.converter(),
        wikiLinkPrefix = "#/wiki/";
    function wikiToHtml(string) {
        return showdownConverter.makeHtml(string.replace(/\[\[(.*)\]\]/gm,"[$1]("+wikiLinkPrefix+"$1)"))
    };

    content.bindPath("/notes", function() {
        var st = $.mustache(t.notes, {rows:[
            {value: "Foo Bar"}, {value : "Baz Bam"}
            ]})
        $('#content').html(st);
    });

    content.bindPath("/edit/:name", function(e, params) {
        var id = 'wiki:'+Math.random();
        coux.get(id, function(err, doc) {
            if (err) {
                // template for new doc
                doc = {
                    _id : id, 
                    tags : [],
                    // members : [],
                    markdown : "Article content goes here. Link to create new pages like this: [[New Page]]"};
            }
            $('#content').html($.mustache(t.edit, doc));
            $("#content form").submit(function() {
                doc.title = $('input[name="title"]', this).val();
                doc.markdown = $('textarea', this).val();
                console.log(doc);
                pouchdb.put(doc, function(err, ok) {
                    console.log("put",err,ok)
                    $.pathbinder.go("#/wiki/"+params.name);
                });
                return false;
            });
        });
        $("#pagenav .edit").hide();
    });







    content.bindPath("/wiki/:name", function(e, params) {
        var id = 'wiki:' + params.name;
        getDoc(id, function(err, doc) {
            console.log("get", err, doc)
            if (err) {
                doc = {title : 'Want to create page "'+params.name+'"?', 
                    markdown : "Article content goes here. Click [edit](#/edit/"+params.name+") to create a page called \""+params.name+"\"."};
            }
            console.log("get page", doc)
            doc.body = wikiToHtml(doc.markdown);
            $('#content').html($.mustache(ddoc.read, doc));
        });
        $("#breadcrumbs").text("> "+params.name)
        $("#pagenav .edit").attr({href : "#/edit/"+params.name}).show();
    });



    $.pathbinder.begin("/notes");
};

