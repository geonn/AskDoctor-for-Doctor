var args = arguments[0] || {};
var loading = Alloy.createController("loading");
var data;
var room_status = ["","Pending","Seat in", "Conversation ended", "Waiting for Doctor", "Consulting"];
var anchor = COMMON.now();
var last_update = COMMON.now();
var start = 0;

function navTo(e){
	console.log('start from here');
	console.log(e.source);
	params = e.source.records;
	console.log(params);
	Alloy.Globals.Navigator.open("chatroom", params);
}

function doLogout(){
    /*var user = require("user");
    user.logout(function(){
        var win = Alloy.createController("auth/login").getView();
        win.open();
        //Alloy.Globals.Navigator.navGroup.close(); 
        
    });*/
    
    var dr_id = Ti.App.Properties.getString('dr_id') || 0;
    var temp_deviceToken = Ti.App.Properties.getString('deviceToken') || '';
    Ti.App.Properties.removeAllProperties();
    Ti.App.Properties.setString('deviceToken', temp_deviceToken); 
    API.callByPost({url: "doLogoutDoctor", params: {dr_id: dr_id}}, {onload: function(){
        var win = Alloy.createController("auth/login").getView();
        win.open();
        
    }});
}

function getPreviousData(param){
	var model = Alloy.createCollection("room");
	console.log("before get user data?");
	data = model.getUserData();
	console.log(data);
}

function render_list(){
	var setData = [];
	var moment = require('alloy/moment');
	for (var i=0; i < data.length; i++) {
		var message = data[i].message;
		if (data[i].format == "text") {
			message = data[i].message;
		}else{
			message = data[i].format;
		};
		var row = $.UI.create("TableViewRow", {records: data[i], backgroundColor:"#a02532", color: "transparent", id: data[i].sender_name+" "+data[i].patient_name+" "+message});
		var view_main = $.UI.create("View", {touchEnabled:false, classes:['wfill','hsize','horz']});
		var view_left = $.UI.create("View", {touchEnabled:false, classes:['hsize','vert'],top:10, left:0, bottom:5, width: "60%"});
		var dr_name_title = (data[i].dr_name != "")?data[i].dr_name:"No one";
		var status_view = $.UI.create("View", {touchEnabled:false, classes:['hsize', 'vert'], width: "49%"});
		var sitin_view = $.UI.create("View", {touchEnabled:false, classes:['hsize', 'vert'], width: "49%"});
		var status_title = $.UI.create("Label", {touchEnabled:false, classes:['wfill','hsize','h5','bold'], left:10, text: "STATUS"});
		var status_value = $.UI.create("Label", {touchEnabled:false, classes:['wfill','hsize','h5'], left:10, bottom:10, text: room_status[data[i].status]});
		var sitin_title = $.UI.create("Label", {touchEnabled:false, classes:['wfill','hsize','h5','bold'], text: "SEAT IN"});
		var sitin_value = $.UI.create("Label", {touchEnabled:false, classes:['wfill','hsize','h5'], bottom:10, text: dr_name_title});
		var label_user = $.UI.create("Label", {touchEnabled:false, classes:['wfill','hsize','h5','bold'], left:10, text: data[i].patient_name});
		var label_last_user = $.UI.create("Label", {touchEnabled:false, classes:['wfill','hsize','h5'], text: data[i].sender_name});
		var last_sender_title = (data[i].last_sender == Ti.App.Properties.getString('name'))?"You":data[i].last_sender;
		var label_last_message = $.UI.create("Label", {touchEnabled:false, classes:['wfill','hsize','h6'], left:10, text: last_sender_title+": "+message});
		var view_right = $.UI.create("View", {touchEnabled:false, classes:['hsize'],top:10, right:0, width: "30%", bottom:5});
		var label_time = $.UI.create("Label", {touchEnabled:false, classes:['wsize','hsize','h6'], right: 10, minimumFontSize:8, textAlign: "right", right:0, text: moment(data[i].created).fromNow()});
		var view_hr = $.UI.create("View", {classes:['wfill', 'padding'], top:0, backgroundColor: "#ccc", height: 1});
		view_left.add(label_user);
		view_left.add(label_last_message);
		view_main.add(view_left);
		view_right.add(label_time);
		view_main.add(view_right);
		status_view.add(status_title);
		status_view.add(status_value);
		
		sitin_view.add(sitin_title);
        sitin_view.add(sitin_value);
		
        view_main.add(status_view);
        view_main.add(sitin_view);
		row.add(view_main);
		setData.push(row);
	};
	$.tbl.setData(setData);
}

function refresh(){
    $.doctor_name.text = Ti.App.Properties.getString('name');
	loading.start();
	var checker = Alloy.createCollection('updateChecker'); 
	var dr_id = Ti.App.Properties.getString('dr_id') || 0;
	var isUpdate = checker.getCheckerById(0, dr_id);
	var last_updated = isUpdate.updated || "";
	last_update = last_updated;
	console.log({dr_id: dr_id});
	API.callByPost({url:"getMessageListForDoctor", params: {dr_id: dr_id}}, 
		{onload: function(responseText){
			var model = Alloy.createCollection("room");
			var res = JSON.parse(responseText);
			var arr = res.data || undefined;
			if(res.status == "success"){
				console.log(res.last_updated+" res.last_updated");
				//model.saveArray(arr);
				//checker.updateModule(0, "getMessage", res.last_updated, dr_id);
				//getPreviousData();
				data = res.data;
				render_list();
			}else{
				alert(res.data);
			}
			loading.finish();
		}
	});
}

function popMore(){
	var dialog = Ti.UI.createOptionDialog({
	  cancel: 3,
	  options: ['Logout', "App Version "+Titanium.App.version, 'Cancel'],
	  title: 'More'
	});
		
	dialog.show(); 
	dialog.addEventListener("click", function(e){   
		if(e.index == 0){
			doLogout();
		}
	});
	dialog=null;
}

function init(){
	console.log("init");
	socket_loaded();
	
	PUSH.registerPush();
	$.win.add(loading.getView());
	var AppVersionControl = require('AppVersionControl');
	$.doctor_name.text = Ti.App.Properties.getString('name');
	
	//AppVersionControl.checkAndUpdate();
}

API.callByPost({url: "dateNow"}, {
    onload: function(responseText){
        var res = JSON.parse(responseText);
        
        if(res.status != "error"){
            COMMON.sync_time(res.data);
        }
        anchor = COMMON.now();
        last_update = COMMON.now();
        console.log("call init");
        init();
    }
});


function onDuty(e){
    console.log(e.name_list);
	var online_doctor = e.name_list;
	var dr_id = Ti.App.Properties.getString('dr_id') || 0;
	var status = false;
	for (var i=0; i < online_doctor.length; i++) {
		if(online_doctor[i].dr_id == dr_id){
			status = true;
		}
	};
	
	if($.onDuty.value != status){
	   var name = Ti.App.Properties.getString('name');
	   socket.join_special_room({name: name, dr_id: dr_id});
	   $.onDuty.value = status;
	}
}

function update_online_status(e){
	var name = Ti.App.Properties.getString('name');
	var dr_id = Ti.App.Properties.getString('dr_id') || 0;
	console.log(e);
	if(e.value){
	    socket.join_special_room({name: name, dr_id: dr_id});
	}else{
		//Ti.App.fireEvent("socket:leave_special_room", {name: name, dr_id: dr_id});
	}
	var device_token = Ti.App.Properties.getString('deviceToken');
	var u_id = Ti.App.Properties.getString('dr_id');
	API.callByPost({url: "updateDoctorDeviceToken", params: {u_id: u_id, device_id: device_token}}, {onload: function(res){console.log(res);}});
}

function socket_loaded(){
	var name = Ti.App.Properties.getString('name');
	var dr_id = Ti.App.Properties.getString('dr_id') || 0;
	socket.getDoctorList({name: name, dr_id: dr_id});
	socket.setRoom({room_id: "doctor"});
}

Ti.App.addEventListener('socket_loaded', socket_loaded);
Ti.App.addEventListener('home:refresh',refresh);

$.win.addEventListener("open", function(){
   if (this.activity) {
    this.activity.onResume = function() {
      socket.connect();
      refresh();
    };  
    this.activity.onPause = function() {
      socket.disconnect();
    }; 
  }else {
    Ti.App.addEventListener("resumed", function() {
        console.log("app resume");
        socket.connect();
        refresh();
    });
  } 
});

Ti.App.addEventListener("doctor:refresh_patient_list", refresh);
Ti.App.addEventListener("controller:getDoctorList", onDuty);

$.win.addEventListener("close", function(){
	Ti.App.removeEventListener("doctor:getDoctorList");
	Ti.App.removeEventListener("doctor:refresh_patient_list");
	/*Ti.App.removeEventListener('home:refresh',refresh);
	Ti.App.removeEventListener('home:init',init);*/
	$.destroy();
});
