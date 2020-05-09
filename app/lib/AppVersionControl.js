/*********************
*** APP VERSION CONTROL ***
* 
* Latest Version 1.1.4
* 
**********************/

// update user device token
exports.checkAndUpdate = function(e){
	API.callByPost({url:"checkDoctorAppVersion", params: {appVersion: Ti.App.version,appPlatform: Ti.Platform.osname}}, {onload: callback_download});
};

function callback_download(e){
	console.log(e);
	var source = JSON.parse(e);
	if(source.status == "error"){
		var changelog = source.data.change_log.replace("[br]", "\n");
		console.log(changelog);
		var dialog = Ti.UI.createAlertDialog({
		  cancel: 1,
		  buttonNames: ['Download', 'Cancel'],
		  title: "Latest version download",
		  message: 'Latest version found : '+source.currentVersion+"\n "+changelog
		});
		console.log("why popup");
		dialog.show();
		
		dialog.addEventListener("click", function(ex){
			try {
				console.log(source.data);
				Ti.Platform.openURL(source.data.url);/*
				var intent = Ti.Android.createIntent({
				    action: Ti.Android.ACTION_VIEW,
				    data: "http://bit.ly/1U7Qmd8",
				    type: "application/vnd.android.package-archive",
				  });
				  Ti.Android.currentActivity.startActivity(intent);*/
			} catch(e) {
			    Ti.API.info("e ==> " + JSON.stringify(e));
			}
			if(OS_ANDROID){
			    var appActivity = Ti.Android.currentActivity;
	            appActivity.finish();
			}
		});
	}
	
}
