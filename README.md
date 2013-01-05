TouchGap
========

Container for building HTML5 mobile apps with PhoneGap and TouchDB

You edit `www/`, and write some Objective-C map reduce indexes. Uou save JSON documents to TouchDB, which sync via the cloud to other mobile devices and users. Data on the local device means a snappy user experience. Sync via the cloud adds opportunties for multiuser interaction.

Here's what saving a form entry to the database could look like in your app:

```javascript
$(function(){
	$("form").submit(function() {
		$.ajax("http://localhost.touchdb./sync", {
			dataType : "json",
			type : "POST",
			data : $(this).serializeArray(),
			success : function(meta) {
				console.log("saved your document "+ meta.id);
			}
		});
		return false;
	});
});
```
Here are a few example apps using it:

[Chat] [Wiki]

Imagine those are links and screenshots.

## The Tech

The project uses Apache Cordova as a base layer, with the goal to abtract the TouchDB integration to a Cordova Plugin. For now, someone will have to update TouchDB and Cordova manually in this project. Once the plugin integration is done, these example apps should only need to include a `www/` folder, and work with boilerplate Cordova and TouchDB.


## Contribute

Right now we need big help in packaging the Objective C bits as a plugin, so that it can be used on PhoneGap Build.



