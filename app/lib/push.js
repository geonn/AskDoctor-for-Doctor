var Cloud = require('ti.cloud');
var app_status;
var CloudPush;
Ti.App.Properties.setString('room_id', "");
if(Ti.Platform.osname == "android"){
	CloudPush = require('ti.cloudpush');
	CloudPush.addEventListener('callback', function (evt) {
		var payload = JSON.parse(evt.payload);

		Ti.App.Payload = payload;
		// if trayClickLaunchedApp or trayClickFocusedApp set redirect as true
		console.log("callback push");
		receivePush(payload);
	});
	CloudPush.addEventListener('trayClickLaunchedApp', function (evt) {
        var payload = JSON.parse(evt.payload);
        redirect = true;
        //receivePush(payload);
        console.log('Tray Click Launched App (app was not running)');
        receivePush(payload);
        //getNotificationNumber(Ti.App.Payload);
    });

	CloudPush.addEventListener('trayClickFocusedApp', function (evt) {
		redirect = true;
		var payload = JSON.parse(evt.payload);
		console.log('Tray Click Focused App (app was already running)');
		//receivePush(payload);
	});
}

function getNotificationNumber(payload){
	console.log(payload);
}

// Process incoming push notifications
function receivePush(e) {
	console.log(e);
	console.log('receive push');
	var room_id = Ti.App.Properties.getString('room_id');
	var local_redirect = (typeof redirect != "undefined")?redirect:false;
	if(OS_IOS){
		if(e.data.target == "chatroom"){
			var params = {u_id:e.data.u_id, dr_id:e.data.dr_id, room_id:e.data.room_id, status: e.data.status};
			console.log(room_id+" room_id "+e.room_id+" "+local_redirect);
			if(room_id != e.data.room_id && local_redirect){
				Alloy.Globals.Navigator.open("chatroom", params);
			}else{
				Ti.App.fireEvent("home:refresh");
				Ti.App.fireEvent("conversation:refresh");
			}
		}
	}else{
		if(e.target == "chatroom"){
			var params = {u_id:e.u_id, dr_id:e.dr_id, room_id:e.room_id, status: e.status};
			//alert(room_id+" !="+ e.room_id+" "+local_redirect);
			console.log(room_id+" room_id "+e.room_id+" "+local_redirect);
			if(room_id != e.room_id && local_redirect){
				Alloy.Globals.Navigator.open("chatroom", params);
			}else{
			    console.log("refresh home wor");
				Ti.App.fireEvent("home:refresh");
				Ti.App.fireEvent("conversation:refresh");
			}
		}
	}


	//Action after receiving push message

	return false;
}

function deviceTokenSuccess(ex) {
	console.log("deviceTokenSuccess");
    deviceToken = ex.deviceToken;

	Cloud.PushNotifications.subscribeToken({
	    channel: 'general',
	    type:Ti.Platform.name == 'android' ? 'android' : 'ios',
	    device_token: deviceToken
	}, function (sub) {
		console.log(sub);
	    if (sub.success) {
	    	/** User device token**/
	    	console.log(deviceToken+" deviceTokenSuccess");
     		Ti.App.Properties.setString('deviceToken', deviceToken);
			API.updateNotificationToken();
			var device_token = Ti.App.Properties.getString('deviceToken');
			var u_id = Ti.App.Properties.getString('dr_id');
			API.callByPost({url: "updateDoctorDeviceToken", params: {u_id: u_id, device_id: device_token}}, {onload: function(res){console.log(res);}});
	    }
	});
}
function deviceTokenError(e) {
    alert('Failed to register for push notifications! ' + e.error);
}

function registerPush(){
	if (Ti.Platform.name == "iPhone OS" && parseInt(Ti.Platform.version.split(".")[0]) >= 8) {

	 // Wait for user settings to be registered before registering for push notifications
	    Ti.App.iOS.addEventListener('usernotificationsettings', function registerForPush() {

	 // Remove event listener once registered for push notifications
	        Ti.App.iOS.removeEventListener('usernotificationsettings', registerForPush);

	        Ti.Network.registerForPushNotifications({
	            success: deviceTokenSuccess,
	            error: deviceTokenError,
	            callback: receivePush
	        });
	    });

	 // Register notification types to use
	    Ti.App.iOS.registerUserNotificationSettings({
		    types: [
	            Ti.App.iOS.USER_NOTIFICATION_TYPE_ALERT,
	            Ti.App.iOS.USER_NOTIFICATION_TYPE_SOUND,
	            Ti.App.iOS.USER_NOTIFICATION_TYPE_BADGE
	        ]
	    });
	}else if(Ti.Platform.osname == "android"){
		CloudPush.retrieveDeviceToken({
		    success: deviceTokenSuccess,
		    error: deviceTokenError
		});
	}else{
		Titanium.Network.registerForPushNotifications({
		    types: [
		        Titanium.Network.NOTIFICATION_TYPE_BADGE,
		        Titanium.Network.NOTIFICATION_TYPE_ALERT,
		        Titanium.Network.NOTIFICATION_TYPE_SOUND
		    ],
			success:deviceTokenSuccess,
			error:deviceTokenError,
			callback:receivePush
		});
	}
}

exports.setInApp = function(){
	console.log('In App');
	setTimeout(function(){
	    console.log("redirect set as false by setInApp");
        redirect = false;
    }, 2000);
	//redirect = false;
};

exports.registerPush = function(){
	if (OS_IOS) {
		Ti.UI.iOS.setAppBadge("0");
	}
	setTimeout(function(){
        console.log("redirect set as false by setInApp");
        redirect = false;
    }, 2000);
	registerPush();
};
