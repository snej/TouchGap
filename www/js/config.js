

var t = exports.t = {
  "ok" : true
};


$('script[type="text/mustache"]').each(function() {
    var id = this.id.split('-');
    id.pop();
    console.log(id);
    t[id.join('-')] = $(this).html();
});

