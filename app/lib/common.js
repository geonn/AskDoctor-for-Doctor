var mainView = null;

exports.construct = function(mv){
	mainView = mv;
};
exports.deconstruct = function(){  
	mainView = null;
};

function openWindow(win){
	if(Ti.Platform.osname == "android"){
	  	win.open(); //{fullscreen:false, navBarHidden: false}
	}else{ 
		var nav = Alloy.Globals.navMenu;
		nav.openWindow(win,{animated:true});  
	} 
}


//function closeWindow(win){
exports.closeWindow = function(win){
	if(Ti.Platform.osname == "android"){ 
	  	win.close(); 
	}else{ 
		var nav = Alloy.Globals.navMenu;
		nav.closeWindow(win,{animated:true});  
	} 
};

function dialogTextfield(callback){
	var textfield = Ti.UI.createTextField();
	var dialog = Ti.UI.createAlertDialog({
	    title: 'Enter Point',
	    androidView: textfield,
	    style: Ti.UI.iPhone.AlertDialogStyle.PLAIN_TEXT_INPUT,
	    buttonNames: ['OK', 'cancel']
	});
	dialog.addEventListener('click', function(e){
		var point = (OS_IOS)?e.text:textfield.value;
		console.log("bidding point"+point);
	    callback(point);
	});
	dialog.show();
}

function createAlert(tt,msg, callback){
	var box = Titanium.UI.createAlertDialog({
		title: tt,
		ok: 'OK',
		message: msg
	});
	box.show();
	box.addEventListener('click', function(e){
		console.log(e.index+" "+e.source.ok);
	    if (e.index == 0){
	    	console.log(typeof callback);
	    	if(typeof callback == "function"){
	    		callback && callback();
	    	}
	    }
  });
};

exports.openWindow = _.throttle(openWindow, 500, true);
//exports.closeWindow = _.debounce(closeWindow, 0, true);
exports.createAlert = _.throttle(createAlert, 500, true);
exports.dialogTextfield = _.throttle(dialogTextfield, 500, true);

exports.now = function(){
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
};

exports.sync_time = function(time){ 
	var a = time.trim();
	a = a.replace("  ", " ");
	var b = a.split(" ");
	var date = b[0].split("-");
	var time = b[1].split(":"); 
	var s_date = new Date(date[0], date[1]-1, date[2],time[0],time[1],time[2]);
	var now = new Date();
	var s = Date.parse(s_date.toUTCString());
	var l = Date.parse(now.toUTCString());
	
	time_offset = s-l; 
};