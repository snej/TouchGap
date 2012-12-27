
module.exports = {
  t : {},
  dbUrl : ""

}
var t = exports.t = {
  "ok" : true
};

exports.dbUrl =

$('script[type="text/mustache"]').each(function() {
    var id = this.id.split('-');
    id.pop();
    console.log(id);
    t[id.join('-')] = $(this).html();
});

