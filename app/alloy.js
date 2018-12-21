// The contents of this file will be executed before any of
// your view controllers are ever executed, including the index.
// You have access to all functionality on the `Alloy` namespace.
//
// This is a great place to do any initialization for your app
// or create any global variables/functions that you'd like to
// make available throughout your app. You can easily make things
// accessible globally by attaching them to the `Alloy.Globals`
// object. For example:
//
// Alloy.Globals.someGlobalFunction = function(){};

var _ = require('underscore')._;
var API = require('api');
var redirect = true;
var COMMON = require('common');
var DBVersionControl = require('DBVersionControl');
var socket = require('socket');

var last_update_on = true;
var room_id = 0;
DBVersionControl.checkAndUpdate();

function parent(key, e){
	// if key.value undefined mean it look for key only
	console.log(typeof key.value);
	console.log(key.value);
	if(typeof key.value != "undefined"){

		if(eval("e."+key.name+"") != key.value){
			if(eval("e.parent."+key.name+"") != key.value){
				if(eval("e.parent.parent."+key.name+"") != key.value){
					if(eval("e.parent.parent.parent."+key.name+"") != key.value){
						console.log("box not found");
					}else{
						return e.parent.parent.parent;
					}
	    		}else{
	    			return e.parent.parent;
	    		}
	    	}else{
	    		return e.parent;
	    	}
	    }else{
	    		return e;
	    }
	}else{
		if(eval("typeof e."+key.name) == "undefined"){
			console.log(e);
			if(eval("typeof e.parent."+key.name+"") == "undefined"){
				console.log(e.parent);
				if(eval("typeof e.parent.parent."+key.name+"") == "undefined"){
					console.log(e.parent.parent);
					if(eval("typeof e.parent.parent.parent."+key.name+"") == "undefined"){
						console.log(typeof e.parent.parent.parent.records);
						console.log("box not found");
					}else{
						return eval("e.parent.parent.parent."+key.name);
					}
	    		}else{
	    			return eval("e.parent.parent."+key.name);
	    		}
	    	}else{
	    		return eval("e.parent."+key.name);
	    	}
	    }else{
	    		return eval("e."+key.name);
	    }
	}
}

function children(key, e){
	if(eval("e."+key.name+"") != key.value){
		for (var i=0; i < e.children.length; i++) {
			if(eval("e.children[i]."+key.name+"") == key.value){
		  		return e.children[i];
		 	}
			for (var a=0; a < e.children[i].children.length; a++) {
			  if(eval("e.children[i].children[a]."+key.name+"") == key.value){
			  	return e.children[i].children[a];
			  }
			  for (var c=0; c < e.children[i].children[a].children.length; c++) {
				  if(eval("e.children[i].children[a].children[c]."+key.name+"") == key.value){
				  	return e.children[i].children[a].children[c];
				  }
				};
			};
		};
    }else{
		return e;
    }
}

function setCurLoc(e){
	console.log('c');
	longitude = e.coords.longitude;
    latitude = e.coords.latitude;
    console.log(longitude+", "+latitude);
    Ti.App.Properties.setString('longitude', longitude);
    Ti.App.Properties.setString('latitude', latitude);
}

function checkGeoLocation(){
	if (Titanium.Geolocation.locationServicesEnabled) {
	    Titanium.Geolocation.accuracy = Titanium.Geolocation.ACCURACY_HIGH;
	    //Ti.Geolocation.addEventListener('location', setCurLoc);
	    try
		{
	    	Titanium.Geolocation.getCurrentPosition(setCurLoc);
	    }
	    catch(e){
	    	console.log(e);
	    }
	} else {
		Common.createAlert("Error", "Please enable location services");
	}
}

Titanium.App.addEventListener('resumed', function(e) {
	checkGeoLocation();
});


var message_popup = false;

function message_alert(e){
	var dialog = Ti.UI.createAlertDialog({
		cancel: 1,
		buttonNames: ['Cancel','OK'],
		message: 'You got replied from helpdesk. Do you want to read now?',
		title: 'Helpdesk replied'
	});
	dialog.addEventListener('click', function(ex){
		if (ex.index === 0){
			//Do nothing
		}else{
			nav.navigateWithArgs("conversation");
		}
		message_popup = false;
	});
	if(!message_popup){
		dialog.show();
		message_popup = true;
	}
}

function pixelToDp(px) {
    return ( parseInt(px) / (Titanium.Platform.displayCaps.dpi / 160));
}

function currentDateTime(){
	var today = new Date();
	var dd = today.getDate();
	var mm = today.getMonth()+1;
	var yyyy = today.getFullYear();

	var hours = today.getHours();
	var minutes = today.getMinutes();
	var sec = today.getSeconds();
	if (minutes < 10){
		minutes = "0" + minutes;
	}
	if (sec < 10){
		sec = "0" + sec;
	}
	if(dd<10) {
	    dd='0'+dd;
	}

	if(mm<10) {
	    mm='0'+mm;
	}

	datetime = yyyy+'-'+mm+'-'+dd + " "+ hours+":"+minutes+":"+sec;
	return datetime ;
}
