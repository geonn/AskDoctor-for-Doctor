var args = arguments[0] || {};
var dr_id = args.dr_id || 0;
var loading = Alloy.createController("loading");
var anchor = COMMON.now();
var last_update = COMMON.now();
var start = 0;
var limit = 20;
var refreshIntervalId;
var retry = 0;
var dr_id = Ti.App.Properties.getString('dr_id') || 0;
var last_id = 0;
var last_uid;
var status_text = ["", "Sending", "Sent", "Read"];
var data;
var room_id = args.room_id;
var opposite_online = "false";
var opposite_last_update;

Ti.App.Properties.setString('room_id', room_id);
var voice_recorder = Alloy.createWidget('geonn.voicerecorder', {record_callback: saveLocal, room_id: room_id});
console.log("check args");
console.log(args);

/**
 * Send message
 */
var sending = false;
function SendMessage(){
    console.log(args.status+" args.status send message");
    if($.message.value == "" || sending){
       return;
    }
    loading.start();
    sending = true;
    $.message.editable = false;
    saveLocal({message: $.message.value, format:"text"});
}

function saveLocal(param){
  if(args.status == 2){
      console.log({dr_id: dr_id, room_id: room_id, status: 5});
      API.callByPost({url:"changeRoomStatus", params: {dr_id: dr_id, room_id: room_id, status: 5}}, {
      onload: function(responseText){
          console.log("change room status to 5");
          args.status = 5;
          $.action_button.title = "End Session";
          $.action_button.action = "endSession";
          //socket.fireEvent("socket:startTimer", {room_id: room_id});
          }
      });
  }
	var model = Alloy.createCollection("conversations");
	var app_id = Math.random().toString(36).substr(2, 10);
	var local_save = [{
		"dr_id": dr_id,
		"id": app_id,
		"room_id": room_id,
	    "sender_id": dr_id,
	    "message": param.message,
	    "created": COMMON.now(),
	    "is_endUser": 0,
	    "dr_id": dr_id,
	    "format": param.format,
	    "status": 1,
	    "u_id": args.u_id,
	    "sender_name": Ti.App.Properties.getString('name'),
	}];
	model.saveArray(local_save);
	//getLatestData(true);
	data = [{
	    "dr_id": dr_id,
        "id": app_id,
        "sender_id": dr_id,
        "message": param.message || param.filedata,
        "created": COMMON.now(),
        "is_endUser": 0,
        "dr_id": dr_id,
        "format": param.format,
        "status": 1,
        "u_id": args.u_id,
        "sender_name": Ti.App.Properties.getString('name'),
	}];
	render_conversation(true, true);
	var api_param = {dr_id: dr_id, message: param.message, is_doctor:1, is_endUser:0, u_id: args.u_id, sender_name: Ti.App.Properties.getString('name'), format: param.format, sender_id: dr_id, id: app_id, room_id: room_id };
	if(param.format == "voice" || param.format == "photo"){
	   _.extend(api_param, {media: param.format, Filedata: param.filedata});
	}
  if(param.format == "photo"){
    loading.start();
  }
	console.log(api_param);
	API.callByPost({url: "sendMessage", type: param.format, params:api_param}, {onload: function(responseText){

		var res = JSON.parse(responseText);
		$.message.value = "";
		$.message.editable = true;
		sending = false;
		$.message.blur();
		loading.finish();
        $.enter_icon.right = -50;
		socket.sendMessage({room_id: room_id});
	}});
}

function navToWebview(e){
	var url = e.source.url;
	console.log(url);
	var win = Alloy.createController("webview", {url: url}).getView();
	win.open();
}

function render_conversation(latest, local){
    if(latest && local != true){
        if(sending){
            sending = false;
            console.log("sending set false");
        }else{

        }
        //$.chatroom.setContentOffset({y: 100});
    }
    if(latest){
        data.reverse();
    }
    for (var i=0; i < data.length; i++) {
        if(data[i].status == 1 && !local){
            console.log("fail so can sending o");
            API.callByPost({url: "sendMessage", type: data[i].format, params:data[i]}, {onload: function(responseText){
                var res = JSON.parse(responseText);
                socket.sendMessage({room_id: room_id});
            }});
        }
        updateRow(data[i], latest);
        /*
        if((data[i].is_endUser && data[i].status > 1) || data[i].status == 3){

        }else{
            addRow(data[i], latest);
        }*/
    }
    //updateReadStatus();
}

function addRow(row, latest){
	var view_container = $.UI.create("View",{
		classes: ['hsize','wfill'],
		id: row.id,
		message: row.message,
		status: row.status,
		is_endUser: row.is_endUser,
		created: row.created
	});

	if(row.sender_id){
	    console.log(row.sender_id+" can add?"+row.message );
		var view_text_container = $.UI.create("View", {
			classes:  ['hsize', 'vert', 'rounded'],
			top: 10,
			width: "75%",
			transform: Ti.UI.create2DMatrix().rotate(180),
			url: row.message
		});
		var label_name = $.UI.create("label",{
			classes: ['h6','wfill', 'hsize', 'bold'],
            top: 5,
            left: 10,
            bottom: 15,
			color: "#FFFFFF",
			text: row.sender_name
		});

		var ss = row.message;
		var newText = (row.format != "photo")?ss.replace("[br]", "\r\n"):row.message;
		var text_color = (row.format == "link")?"blue":"#ffffff";

		var label_message = $.UI.create("Label", {
			classes:['h5', 'wfill', 'hsize','padding'],
			top:5,
			color: text_color,
			text: newText
		});
		var row_status = (opposite_last_update > row.created || opposite_online == "true")?3:row.status;
		console.log("addrow "+opposite_last_update +" "+ row.created+" || "+opposite_online);
		console.log(row_status+" "+row.status);
	   if(!row.is_endUser){
	       var last_update_by_room = socket.getLastUpdateByRoom(room_id);
	       if(last_update_by_room && last_update_by_room > row.created){
	           row_status = 3;
	       }
	   }
		var label_time = $.UI.create("Label", {
			classes:['h7', 'wsize', 'hsize'],
            bottom:0,
            left: 10,
			text: (row.is_endUser)?timeFormat(row.created):timeFormat(row.created)+" "+status_text[row_status],
			textAlign: "right"
		});

		var view_photo_name = $.UI.create("View", {classes:['wfill','hsize']});
		var view_hr = $.UI.create("View", {height: 1, width: Ti.UI.FILL, backgroundColor: "#ccc", top:5, left:10, right: 10});
        view_photo_name.add(label_name);
        view_text_container.add(view_photo_name);
        view_text_container.add(view_hr);

		if (row.format == "link"){
			var label_message2 = $.UI.create("Label", {
				classes:['h5', 'wfill', 'hsize','small_padding'],
				top: 0,
				left:15,
				text: "Thanks you for contacting our call centre. \nWe would love to hear your thoughts or feedback on how we can improve your experience!\nClick below to start the survey:"
			});
			view_text_container.add(label_message2);
			view_text_container.add(label_message);
		}else if(row.format == "voice"){
			var player = Alloy.createWidget('dk.napp.audioplayer', {playIcon: "\uf144", pauseIcon: "\uf28c", win: $.win, room_id: room_id});

			player.setUrl(newText);
			//download_video(player, newText);
			var view = $.UI.create("View", {classes:['wfill','hsize','padding']});
			view.add(player.getView());
			view_text_container.add(view);
		}else if(row.format == "photo"){
		    var view = $.UI.create("View", {classes:['wfill','hsize','padding'], backgroundColor:"black", height: 200});
		    var image_photo = $.UI.create("ImageView", {image: newText, classes:['hsize','wfill']});
            view.add(image_photo);
            view_text_container.add(view);
            image_photo.addEventListener("click", imageZoom);
		}else{
			view_text_container.add(label_message);
		}

		view_photo_name.add(label_time);
		if(!row.is_endUser){
			view_text_container.setBackgroundColor("#84474a");
			view_text_container.setLeft(10);
            label_name.left = 10;
            label_time.left = 10;
			//view_container.add(imageview_thumb_path);
		}else{
			view_text_container.setBackgroundColor("#871f28");
			//
			if(typeof args.record != "undefined"){

				view_text_container.width = "60%";
				view_text_container.setRight(60);
			}else{
				view_text_container.setRight(10);
			}
		}
		if(row.format == "link"){
			label_message.addEventListener("click", navToWebview);
		}

	}else{
	    console.log(row.message+" is no sender_id");
		var view_text_container = $.UI.create("View", {
			transform: Ti.UI.create2DMatrix().rotate(180),
			classes: ['wsize','hsize','box','rounded'],
			top: 5,
			backgroundColor: "#3ddaf6"
		});

		var label_system_msg = $.UI.create("Label",{
			classes: ['wsize', 'hsize','padding','h6'],
			text: row.message
		});
		view_text_container.add(label_system_msg);
	}
	view_container.add(view_text_container);
	view_container.addEventListener("longpress", function(e){
	    /*
		var m_id = parent({name: "m_id"}, e.source);
		var message_box = parent({name: "m_id", value: m_id}, e.source);
		var dialog = Ti.UI.createAlertDialog({
		    cancel: 1,
		    buttonNames: ['Confirm', 'Cancel'],
		    message: 'Would you like to delete the message?',
		    title: 'Delete'
		  });

	  dialog.addEventListener('click', function(ex){
		 if (ex.index === ex.source.cancel){

		 }else if(ex.index == 0){

		 	var model = Alloy.createCollection("conversations");
			model.removeById(m_id);
		 	$.inner_area.remove(message_box);
		 }
		});
		dialog.show();*/
	});
	if(latest){
		$.inner_area.insertAt({view: view_container, position: 0});
	}else{
		$.inner_area.add(view_container);
	}
}

function imageZoom(e){
    if(typeof e.source.image == "object"){
        return;
    }
    var path = (typeof e.source.image == "object")?e.source.image.nativePath:e.source.image;
    var html = "<img width='100%' height='auto' src='"+path+"'/>";
    if(OS_IOS){
        Alloy.Globals.Navigator.open("webview", {url: path, title: ""});
        //var webview = $.UI.create("WebView", {backgroundColor: "#000",  zIndex: 12, classes:['wfill','hsize'], url: e.source.record.attachment});
    }else{
        Alloy.Globals.Navigator.open("webview", {content: html, title: ""});
        //var webview = $.UI.create("WebView", {backgroundColor: "#000",  zIndex: 12, classes:['wfill','hsize'], html: html});
    }
}

function updateReadStatus(e){
    var inner_area = $.inner_area.getChildren();
    for (var i=0; i < inner_area.length; i++) {

        if(inner_area[i].children[0].children.length <= 1){
            console.log("not possible here");
            //$.bottom_bar.hide();
        }else if(inner_area[i].is_endUser != 1 && typeof inner_area[i].children[0].children[inner_area[i].children[0].children.length - 1] != "undefined" && (opposite_last_update > inner_area[i].created || opposite_online == "true") &&  inner_area[i].status == 2){
            console.log(inner_area[i].is_endUser+" inner_area[i].is_endUser");
            inner_area[i].status = 3;
            inner_area[i].children[0].children[0].children[inner_area[i].children[0].children[0].children.length - 1].text = timeFormat(inner_area[i].created)+" "+status_text[3];
        }
    };
}

function updateRow(row, latest){
	var found = false;
	var inner_area = $.inner_area.getChildren();
	for (var i=0; i < inner_area.length; i++) {
        if(inner_area[i].id == row.id){
            found = true;

        }
        if(inner_area[i].children[0].children.length > 1 && inner_area[i].status == 1){
            console.log(opposite_online+" updaterow");
      		inner_area[i].status = (opposite_online == "true")?3:row.status;
            inner_area[i].children[0].children[0].children[inner_area[i].children[0].children[0].children.length - 1].text = timeFormat(row.created)+" "+status_text[(opposite_online == "true")?3:row.status];
            //inner_area[i].children[0].children[0].children[inner_area[i].children[0].children[0].children.length - 1].text = timeFormat(row.created)+" "+status_text[(opposite_online)?3:row.status];
        }
    };
	if(!found){
		addRow(row, latest);
	}
}

function endSession(){
    var dialog = Ti.UI.createAlertDialog({
            cancel: 1,
            buttonNames: ['Confirm', 'Cancel'],
            message: 'Would you like to end the conversation?',
            title: 'End Session'
          });

      dialog.addEventListener('click', function(ex){
          console.log(ex.index);
         if (ex.index === ex.source.cancel){

         }else{
             closeRoom();
         }
      });
    dialog.show();
}

function closeRoom(){
	var dr_id = Ti.App.Properties.getString('dr_id') || 0;
	API.callByPost({
		url:"closeRoom",
		params: {dr_id: dr_id, room_id: room_id}
	},{
		onload: function(responseText){
			socket.sendMessage({room_id: room_id});
		}
	});
	closeWindow();
}

function switchIcon(e){
	if(e.source.value != ""){
		$.enter_icon.right = 10;
	}else{
		$.enter_icon.right = -50;
	}
}

var user_read_status, doctor_read_status;

function getConversationByRoomId(callback){
	var checker = Alloy.createCollection('updateChecker');
	var dr_id = Ti.App.Properties.getString('dr_id') || 0;
	var isUpdate = checker.getCheckerById(1, args.u_id);
	var last_updated = isUpdate.updated || "";
	last_update = last_updated;
	console.log({dr_id: dr_id, last_updated: last_updated, u_id: args.u_id, is_doctor: 1, room_id: room_id});
	API.callByPost({url:"getMessage", params: {dr_id: dr_id, last_updated: last_updated, u_id: args.u_id, is_doctor: 1, room_id: room_id}},
		{onload: function(responseText){
			var model = Alloy.createCollection("conversations");

			var res = JSON.parse(responseText);
			var arr = res.data || undefined;
			//console.log(res.last_updated+" res.last_updated");
			model.saveArray(arr, callback);
			checker.updateModule(1, "getMessage", res.last_updated, args.u_id);
			var update_id = _.pluck(arr, "id");
			user_read_status = res.user_read_status;
			doctor_read_status = res.doctor_read_status;
			//updateStatus(update_id);
			args.status = res.room_status;
			if(args.status == 3){
			    $.bottom_bar.hide();
			}
			callback && callback();
		}
	});
}

function updateStatus(arr){
	for (var i=0; i < arr.length; i++) {
		var c = $.inner_area.getChildren();
		for (var b=0; b < $.inner_area.children.length; b++) {
			if($.inner_area.children[b].m_id == arr[i]){
				var time = $.inner_area.children[b].children[0].children[2].text.split(" ");
				$.inner_area.children[b].children[0].children[2].text = time[0]+time[1]+time[2]+" Sent";
			}
		};
	};
}

function scrollToBottom(){
	$.chatroom.scrollToBottom();
}

/*
 	Refresh
 * */
function refresh(callback, firsttime){
	retry = 0;
	loading.start();
	getConversationByRoomId(function(){
		callback({firsttime: firsttime});
		loading.finish();
		refreshing = false;
		//var model = Alloy.createCollection("conversations");
		//model.messageRead({dr_id: dr_id});
	});

}
var refreshing = false;
var time_offset = COMMON.now();
function refresh_latest(param){
	if(!refreshing && time_offset < COMMON.now()){
		refreshing = true;
		refresh(getLatestData);
		time_offset = COMMON.now();
	}
}

function filterFunction(collection) {
    //return collection.where({u_id:args.u_id});
}

function getPreviousData(param){

	start = (typeof start != "undefined")? start : 0;
	var model = Alloy.createCollection("conversations");
	console.log(args.u_id+" args.u_id");
	data = model.getData(false, start, anchor,"", args.u_id, room_id);
	console.log("get previous data");
	console.log(data.length);
	last_id = (data.length > 0)?_.first(data)['id']:last_id;
	last_update = (data.length > 0)?_.last(data)['created']:last_update;
	last_uid = (data.length > 0)?_.first(data)['sender_id']:last_uid;
	render_conversation(false, false);
	start = start + 10;
}
/*
function getPreviousData(param){
	start = parseInt(start);
	var model = Alloy.createCollection("conversations");
	console.log(dr_id+" dr_id");
	console.log(args.u_id+" args.u_id");
	data = model.getData(false, limit, anchor,"", args.u_id);
	var estimate_time = Ti.App.Properties.getString('estimate_time');

	last_id = (data.length > 0)?_.first(data)['id']:last_id;
	last_update = (data.length > 0)?_.last(data)['created']:last_update;
	last_uid = (data.length > 0)?_.first(data)['sender_id']:last_uid;
	render_conversation();
	/*
	if(typeof param.firsttime != "undefined"){
		if(OS_IOS){
			$.chatroom.setContentOffset({y: 0}, {animated: false});
			//$.chatroom.contentOffset.y = 1500;//(0, 1000, false);
		}
	}else{

	}
}*/

function getLatestData(local){
	var model = Alloy.createCollection("conversations");
	//model.getData(false, start, last_update,"", args.u_id);
	data = model.getData(true,"","", last_update, args.u_id, room_id);
	console.log("get latest data");
	console.log(data.length);
	render_conversation(true, local);
	//setTimeout(function(e){scrollToBottom();}, 500);
}

function transformFunction(model){
	var transform = model.toJSON();
    transform.time = timeFormat(transform.created);
    return transform;
}

function timeFormat(datetime){
	var timeStamp = datetime.split(" ");
	var newFormat;
	var ampm = "am";
	var date = timeStamp[0].split("-");
	if(timeStamp.length == 1){
		newFormat = date[2]+"/"+date[1]+"/"+date[0] ;
	}else{
	   var time = timeStamp[1].split(":");
	   if(time[0] >= 12){
			ampm = "pm";
			time[0] = time[0] - 12;
	   }

		newFormat = date[2]+"/"+date[1]+"/"+date[0] + " "+ time[0]+":"+time[1]+ " "+ ampm;
	}

	return newFormat;
}

/**
 * Closes the Window
 */
function closeWindow(){
	$.win.close();
}
var mic = voice_recorder;
function second_init(){

	$.action_btn.add(mic.getView());
	if(OS_ANDROID){
	    $.win.setWindowSoftInputMode(Ti.UI.Android.SOFT_INPUT_ADJUST_PAN);
	}
	socket.setRoom({room_id: args.room_id});
    updateTime({online:true});
	$.win.add(loading.getView());
	if(!Titanium.Network.online){
		//COMMON.createAlert("Alert", "There is no internet connection.", closeWindow);
	}

	refresh(getPreviousData, true);
}

function startRecording(){
    mic.startRecording();
}

function stopRecording(){
    mic.stopRecording();
}

function changeBg(e){
    if(e.type == "touchstart"){
        e.source.backgroundColor = "orange";
    }else{
        e.source.backgroundColor = "green";
    }
}

function updateTime(e){
  var dr_id = Ti.App.Properties.getString('dr_id') || 0;
  socket.update_room_member_time({last_update: COMMON.now(), u_id: dr_id, room_id: room_id, online: e.online});
}

var data_loading = false;
function scrollChecker(e){
	var total = (OS_ANDROID)?pixelToDp(e.y): e.y;
	var nearEnd = ($.inner_area.rect.height-$.chatroom.rect.height) - 200;

	if(total >= nearEnd && !data_loading){
		data_loading = true;
		getPreviousData({});
		/*
		var model = Alloy.createCollection("conversations");
		limit = model.getData(false, limit, anchor,"", args.u_id);
		*/
		setTimeout(function(){
			//$.chatroom.setContentOffset({y: top}, {animated: false});
			data_loading = false;
		}, 200);
	}
}

function loadingStart(){
	loading.start();
}

function checkingInternalPermission(){
	if(Titanium.Filesystem.hasStoragePermissions()){
  		second_init();
 	}else{
 		setTimeout(function(){
	  		Titanium.Filesystem.requestStoragePermissions(function(e) {
	       		if (e.success) {
	     			second_init();
	       		} else {
	     			COMMON.createAlert("Warning","You don't have file storage permission!!!\nYou can go to setting enabled the permission.",function(e){
	      				closeWindow();
	    	 		});
	       		}
	  	 	});
	  	},1000);
	}
}

function filepermittion()
{
	if(OS_ANDROID)
	{
		if(Ti.Filesystem.hasStoragePermissions()) return true;
		else{
			 Ti.Filesystem.requestStoragePermissions(function(e){
			    if(e.success){
			    	return true;
			    }
			    else{
			        alert("You denied permission.");
			        return false;
			   	}
			 });
		}
	}else{
		if(Ti.Media.hasPhotoGalleryPermissions()) return true;
		else{
			 Ti.Media.requestPhotoGalleryPermissions(function(e){
			    if(e.success){
			    	return true;
			    }
			    else{
			        alert("You denied permission.");
			        return false;
			   	}
			 });
		}
	}
}

function popCamera(e){

	if(!filepermittion()) return;

	var dialog = Titanium.UI.createOptionDialog({
	    title: 'Choose an image source...',
	    options: ['Camera','Photo Gallery', 'Cancel'],
	    cancel:2 //index of cancel button
	});
	var pWidth = Ti.Platform.displayCaps.platformWidth;
    var pHeight = Ti.Platform.displayCaps.platformHeight;

	dialog.addEventListener('click', function(e) {

	    if(e.index == 0) { //if first option was selected
	        //then we are getting image from camera]
	        if(Ti.Media.hasCameraPermissions()){
        		console.log("Success to open camera");
		        Titanium.Media.showCamera({
		            success:photoSuccessCallback,
		            cancel:function(){
		                //do somehting if user cancels operation
		            },
		            error:function(error) {
		                //error happend, create alert
		                var a = Titanium.UI.createAlertDialog({title:'Camera'});
		                //set message
		                if (error.code == Titanium.Media.NO_CAMERA){
		                    a.setMessage('Device does not have camera');
		                }else{
		                    a.setMessage('Unexpected error: ' + error.code);
		                }

		                // show alert
		                a.show();
		            },
		            allowImageEditing:true,
		            mediaTypes : [Ti.Media.MEDIA_TYPE_PHOTO],
		            saveToPhotoGallery:true
		        });
	        }else{
		        Ti.Media.requestCameraPermissions(function(e){

		        	if(e.success){
		        		console.log("Success to open camera");
				        Titanium.Media.showCamera({
				            success:photoSuccessCallback,
				            cancel:function(){
				                //do somehting if user cancels operation
				            },
				            error:function(error) {
				                //error happend, create alert
				                var a = Titanium.UI.createAlertDialog({title:'Camera'});
				                //set message
				                if (error.code == Titanium.Media.NO_CAMERA){
				                    a.setMessage('Device does not have camera');
				                }else{
				                    a.setMessage('Unexpected error: ' + error.code);
				                }

				                // show alert
				                a.show();
				            },
				            allowImageEditing:true,
				            mediaTypes : [Ti.Media.MEDIA_TYPE_PHOTO],
				            saveToPhotoGallery:true
				        });
		        	}
		        	else{
		        		alert("You denied permission.");
		        	}
		        });
	        }
	    } else if(e.index == 1){

			if(OS_ANDROID)
			{
		    	if(Ti.Filesystem.hasStoragePermissions()){
	        		console.log("Success to open photo gallery");
			        Titanium.Media.openPhotoGallery({

			            success: photoSuccessCallback,
						cancel:function() {
							// called when user cancels taking a picture
						},
						error:function(error) {
							// called when there's an error
							var a = Titanium.UI.createAlertDialog({title:'Camera'});
							if (error.code == Titanium.Media.NO_CAMERA) {
								a.setMessage('Please run this test on device');
							} else {
								a.setMessage('Unexpected error: ' + error.code);
							}
							a.show();
						},
					    // allowEditing and mediaTypes are iOS-only settings
						allowEditing: true,
			            mediaTypes : [Ti.Media.MEDIA_TYPE_PHOTO],
			        });
		        }else{
			        Ti.Filesystem.requestStoragePermissions(function(e){

			        	if(e.success){
			        		console.log("Success to open photo gallery");
					        Titanium.Media.openPhotoGallery({

					            success:photoSuccessCallback,
								cancel:function() {
									// called when user cancels taking a picture
								},
								error:function(error) {
									// called when there's an error
									var a = Titanium.UI.createAlertDialog({title:'Camera'});
									if (error.code == Titanium.Media.NO_CAMERA) {
										a.setMessage('Please run this test on device');
									} else {
										a.setMessage('Unexpected error: ' + error.code);
									}
									a.show();
								},
							    // allowEditing and mediaTypes are iOS-only settings
								allowEditing: true,
					            mediaTypes : [Ti.Media.MEDIA_TYPE_PHOTO],
					        });
			        	}
			        	else{
			        		alert("You denied permission.");
			        	}
			        });
			    }
			}else{
		    	if(Ti.Media.hasPhotoGalleryPermissions()){
	        		console.log("Success to open photo gallery");
			        Titanium.Media.openPhotoGallery({

			            success:photoSuccessCallback,
						cancel:function() {
							// called when user cancels taking a picture
						},
						error:function(error) {
							// called when there's an error
							var a = Titanium.UI.createAlertDialog({title:'Camera'});
							if (error.code == Titanium.Media.NO_CAMERA) {
								a.setMessage('Please run this test on device');
							} else {
								a.setMessage('Unexpected error: ' + error.code);
							}
							a.show();
						},
					    // allowEditing and mediaTypes are iOS-only settings
						allowEditing: true,
			            mediaTypes : [Ti.Media.MEDIA_TYPE_PHOTO],
			        });
		        }else{
			        Ti.Media.requestPhotoGalleryPermissions(function(e){

			        	if(e.success){
			        		console.log("Success to open photo gallery");
					        Titanium.Media.openPhotoGallery({

					            success:photoSuccessCallback,
								cancel:function() {
									// called when user cancels taking a picture
								},
								error:function(error) {
									// called when there's an error
									var a = Titanium.UI.createAlertDialog({title:'Camera'});
									if (error.code == Titanium.Media.NO_CAMERA) {
										a.setMessage('Please run this test on device');
									} else {
										a.setMessage('Unexpected error: ' + error.code);
									}
									a.show();
								},
							    // allowEditing and mediaTypes are iOS-only settings
								allowEditing: true,
					            mediaTypes : [Ti.Media.MEDIA_TYPE_PHOTO],
					        });
			        	}
			        	else{
			        		alert("You denied permission.");
			        	}
			        });
		        }
	    	}
	    } else {

	    }
	});

	//show dialog
	dialog.show();
}

function photoSuccessCallback(event) {
    var new_height = (event.media.height <= event.media.width)?event.media.height*(1024 / event.media.width):1024;
    var new_width = (event.media.width <= event.media.height)?event.media.width*(1024 / event.media.height):1024;
    var blob = event.media;
    console.log(" "+event.media.width+" "+event.media.height);
    console.log(new_width+" "+new_height);
    blob = blob.imageAsResized(new_width, new_height);
    saveLocal({message: event.media.nativePath, format:"photo", filedata: blob});
}

function doAction(e){
    eval(e.source.action+"()");
}

function leaveRoom(){
    API.callByPost({url:"changeRoomStatus", params: {dr_id: dr_id, room_id: room_id, status: 4}}, {
        onload: function(responseText){
            console.log("change room status to 4");
            closeWindow();
        }
    });
    console.log("not here leaveRoom");
    Ti.App.fireEvent("doctor:refresh_patient_list");
    console.log("leave room");
}

function init(){
    if(args.status == 2){
        API.callByPost({url:"changeRoomStatus", params: {dr_id: dr_id, room_id: room_id, status: 2}}, {
        onload: function(responseText){
            var res = JSON.parse(responseText);
            if(res.status == "error"){
                COMMON.createAlert("Error", res.data, function(e){
                    closeWindow();
                });
            }else{
                Ti.App.fireEvent("doctor:refresh_patient_list");
                loading.finish();
            }
        }
        });
        $.action_button.title = "LEAVE ROOM";
        $.action_button.action = "leaveRoom";
    }else if(args.status == 3){
        console.log("init status 3");
        $.action_button.hide();
        $.bottom_bar.hide();
    }else if(args.status == 4){
        loading.start();
        API.callByPost({url:"changeRoomStatus", params: {dr_id: dr_id, room_id: room_id, status: 2}}, {
        onload: function(responseText){
            var res = JSON.parse(responseText);
            if(res.status == "error"){
                COMMON.createAlert("Error", res.data, function(e){
                    closeWindow();
                });
            }else{
                Ti.App.fireEvent("doctor:refresh_patient_list");
                args.status = 2;
                console.log("change room status to 2");
                loading.finish();
            }
        }
        });
        $.action_button.title = "LEAVE ROOM";
        $.action_button.action = "leaveRoom";
    }else if(args.status == 5){
        API.callByPost({url:"changeRoomStatus", params: {dr_id: dr_id, room_id: room_id, status: 5}}, {
        onload: function(responseText){
            var res = JSON.parse(responseText);
            if(res.status == "error"){
                COMMON.createAlert("Error", res.data, function(e){
                    closeWindow();
                });
            }else{
                Ti.App.fireEvent("doctor:refresh_patient_list");
                loading.finish();
            }
        }
        });

        $.action_button.title = "End Session";
        $.action_button.action = "endSession";
    }
    second_init();
    /*
	if (OS_ANDROID) {
		if (Ti.Android.hasPermission("android.permission.RECORD_AUDIO")) {
			checkingInternalPermission();
		}else{
			setTimeout(function(){
				Ti.Android.requestPermissions("android.permission.RECORD_AUDIO",function(e){
					if(e.success){
						checkingInternalPermission();
					}else{
						COMMON.createAlert("Warning","You don't have voice recorder permission!!!",function(e){
							closeWindow();
						});
					}
				});
			},1000);
		};
	}else{
		second_init();
	};*/
}

init();

function patient_last_update(e){
    opposite_online = e.online;
    opposite_last_update = e.last_update;
    updateReadStatus();
}

function resume(){
  console.log("resumed here chatrrom");
  updateTime({online:true});
  refresh_latest();
}

function pause(){
  updateTime({online:false});
}

Ti.App.addEventListener("socket:refresh_chatroom", refresh_latest);
Ti.App.addEventListener('conversation:refresh', refresh_latest);
Ti.App.addEventListener("socket:user_last_update", updateReadStatus);
Ti.App.addEventListener("socket:patient_last_update", patient_last_update);
Ti.App.addEventListener("resumed", resume);
Ti.App.addEventListener("paused", pause);


$.win.addEventListener("close", function(){
    Ti.App.Properties.setString('room_id', "");
    updateTime({online:false});
    console.log(args.status+" window close");
    if(args.status == 2){
        console.log("equal to leave room");
        API.callByPost({url:"changeRoomStatus", params: {dr_id: dr_id, room_id: room_id, status: 4}}, {
        onload: function(responseText){
            console.log("change room status to 4");
                loading.finish();
                Ti.App.fireEvent("doctor:refresh_patient_list");
            }
        });
    }
	Ti.App.fireEvent('home:refresh');
	socket.leave_room({room_id: room_id});
	var folder = Titanium.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, room_id);
    if(folder.exists()){
        folder.deleteDirectory(true);
    }
	Ti.App.removeEventListener("socket:refresh_chatroom", refresh_latest);
	Ti.App.removeEventListener('conversation:refresh', refresh_latest);
    Ti.App.removeEventListener("socket:user_last_update", updateReadStatus);
    Ti.App.removeEventListener("socket:patient_last_update", patient_last_update);
    Ti.App.removeEventListener("resumed", resume);
    Ti.App.removeEventListener("paused", pause);
	$.destroy();

});
