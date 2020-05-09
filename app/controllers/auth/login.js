var args = arguments[0] || {};
var loading = Alloy.createController("loading");

function do_signup(){
	var win = Alloy.createController("auth/signup").getView();
	if(Ti.Platform.osname == "android"){
	  	win.open(); //{fullscreen:false, navBarHidden: false}
	}else{
		win.open();
	}
}

function onload(responseText){
	var result = JSON.parse(responseText);
	console.log(result.status);
	if(result.status == "error"){
		COMMON.createAlert("Error", result.data);
		loading.finish();
		return false;
	}else{
		loading.finish();
		var arr = result.data;
		console.log(arr.doctor_id+" arr.doctor_id");
   		Ti.App.Properties.setString('dr_id', arr.doctor_id);
   		_.each(arr, function(value, key){
   			console.log(key+" = "+value);
            Ti.App.Properties.setString(key, value);
        }); 
   		//Ti.App.Properties.setString('specialty', arr.specialty);
   		//Ti.App.Properties.setString('clinic_id', arr.clinic_id);
   		//Ti.App.Properties.setString('name', arr.name);
			socket.join_special_room({name: arr.name, dr_id: arr.doctor_id});
   		console.log(arr.name+" arr.name");
   		Ti.App.fireEvent("app:_callback", {from: "login"});
		$.win.close();
		//Alloy.Globals.Navigator.navGroup.open({navBarHidden: true, fullscreen: false});
	}
}

function do_login(){

	var username     = $.username.value;
	var password	 = $.password.value;
	if(username ==""){
		COMMON.createAlert("Fail","Please fill in your username");
		return false;
	}
	if(password =="" ){
		COMMON.createAlert("Fail","Please fill in your password");
		return false;
	}
	var device_token = Ti.App.Properties.getString('deviceToken');
	console.log("pluxDoctorLogin login");

	var params = {
	 	device_token: device_token,
		email: username,
		password: password
	};
	console.log(params);
	//API.doLogin(params, $);
	loading.start();
	API.callByPost({url: "pluxDoctorLogin", params: params}, {onload: onload});
}

function init(){
	Alloy.Globals.navWin = $.navWin;
	$.win.add(loading.getView());
}

function closeWindow(){
	$.win.close();
}

Ti.App.addEventListener("closeWindow", closeWindow);

$.win.addEventListener("open", function(){
	console.log("open");
	if(OS_ANDROID){
	   $.win.setSoftKeyboardOnFocus(Ti.UI.Android.SOFT_KEYBOARD_SHOW_ON_FOCUS);
	}
});

$.win.addEventListener("close", function(){
	console.log("close");
	Ti.App.removeEventListener("closeWindow", closeWindow);

});

init();
