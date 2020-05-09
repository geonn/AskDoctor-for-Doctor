var args = arguments[0] || {};
var loading = Alloy.createController("loading");
var anchor = COMMON.now();
var last_update = COMMON.now();
var start = 0;
var retry = 0;
var dr_id = Ti.App.Properties.getString('dr_id') || 0;
var status_text = ["", "Sending", "Sent", "Read"];
var data;
var room_id = args.room_id;
var opposite_online = "false";
var opposite_last_update;
var data_source = [];

Ti.App.Properties.setString('room_id', room_id);
var voice_recorder = Alloy.createWidget('geonn.voicerecorder', {record_callback: saveLocal, room_id: room_id});

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

var first_time_load = true;
function render_conversation(latest, local){
    if(latest && local != true){
        if(sending){
            sending = false;
            console.log("sending set false");
        }
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
    }
    Alloy.Globals.mocx.createCollection("chats", data_source);
    console.log("here check "+first_time_load);
    if(first_time_load){
    	console.log(data.length+" first time load to bottom");
    	$.chatroom.scrollToIndex(data.length - 1,  { animated: false});
    	//setTimeout(function(){}, 1000);
    	first_time_load = false;
    }else if(latest){
    	console.log($.chatroom.data);
      $.chatroom.scrollToIndex(data_source.length -1,  { animated: false});
      console.log("latest scroll to"+data_source.length - 1);
    }else if(data.length > 0){
    	console.log(data.length+" data.length+1");
    	if(OS_IOS){
    		$.chatroom.scrollToIndex(data.length,  { animated: false, position:Titanium.UI.iOS.TableViewScrollPosition.TOP});
    	}else{
    		$.chatroom.scrollToIndex(data.length,  { animated: false});
    	}
	  //setTimeout(function(){}, 0);
    }
    //updateReadStatus();
}

function addRow(row, latest){
  var arr = {
    id: row.id,
		sender_name: row.sender_name,
   	created: (row.is_endUser)?timeFormat(row.created):timeFormat(row.created)+" "+status_text[(opposite_last_update > row.created || opposite_online == "true")?3:row.status],
   	text_color: (row.format == "link")?"blue":"#ffffff",
   	newText: (row.format != "photo")?row.message.replace(/\[br\]/ig, "\r\n"):row.message,
   	bgColor: (!row.is_endUser)?"#84474a":"#871f28",
   	setLeft: (!row.is_endUser)?10:null,
   	setRight: (!row.is_endUser)?null:"10",
    text_visible: (row.format == "text")?true:false,
    photo_visible: (row.format == "photo")?true:false,
    voice_visible: (row.format == "voice")?true:false,
    image_height: (row.format == "photo")?200:0,
    image: (row.format == "photo")?row.message:"",
    voice: (row.format == "voice")?row.message:"",
	};
  if(!latest){
    data_source.unshift(arr);
  }else{
    data_source.push(arr);
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

function onPlayStopBtnClicked(e) {
  if(e.source.new){
    try{
  		if(OS_IOS){
  		    Ti.Media.audioSessionCategory = Ti.Media.AUDIO_SESSION_CATEGORY_SOLO_AMBIENT;
  		}
  		audioPlayer = Ti.Media.createAudioPlayer({
          url : e.source.voice,
          allowBackground : true
      });
      console.log(audioPlayer.volume+"sound volume");
      audioPlayer.volume = 1;
      audioPlayer.release();
      console.log(audioPlayer.volume+"sound volume new");
  	}catch(e){
  		console.log(e.message);
  	}
  	e.source.image = "images/play_button.png";

  	audioPlayer.addEventListener('change', function(ex) {
  		console.log('State: ' + ex.description + ' (' + ex.state + ')');
  	    Ti.API.info('State: ' + ex.description + ' (' + ex.state + ')');
  	    //updateTimeLabel();
        var image;
  	    if(ex.state == 7){	//7 = stopped
  	    	  image = "/images/play_button.png";
  	    }else if(ex.state == 5){    //7 = stopped
              //$.time.text = "";
            image = "/images/play_button.png";
        }else if(ex.state == 2){
  			//$.time.text = "Pause";
        image = "/images/play_button.png";
  		}else if(ex.state == 3){
  			//$.time.text = "Playing...";
        image = "/images/pause_button.png";
  		}
      e.source.image = image;
  	});

  	audioPlayer.addEventListener("complete", function(e){
  		e.source.image = "/images/play_button.png";
          audioPlayer.release();
          console.log("audio release");
  		//$.time.text = "";
  		Ti.Media.audioSessionCategory = Ti.Media.AUDIO_SESSION_CATEGORY_SOLO_AMBIENT;
  	});
    e.source.new = false;
  }
	// If both are false, playback is stopped.
	console.log(audioPlayer.playing+" audioPlayer.playing");
	if (audioPlayer.playing) {
		audioPlayer.pause();
		//$.time.text = "Pause";
		Ti.Media.audioSessionCategory = Ti.Media.AUDIO_SESSION_CATEGORY_SOLO_AMBIENT;
		e.source.image = "/images/play_button.png";
	} else {
		try{
			audioPlayer.start();
		}catch(e){
			console.log("see what error here");
			console.log(e);
		}
		//.time.text = "Playing...";
		Ti.Media.audioSessionCategory = Ti.Media.AUDIO_SESSION_CATEGORY_PLAYBACK;
		e.source.image = "/images/pause_button.png";
	}
	//updateTimeLabel();

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
	for (var i=0; i < data_source.length; i++) {
        if(data_source[i].id == row.id){
            found = true;
            data_source[i] = {
              id: row.id,
          		sender_name: row.sender_name,
             	created: (row.is_endUser)?timeFormat(row.created):timeFormat(row.created)+" "+status_text[(opposite_last_update > row.created || opposite_online == "true")?3:row.status],
             	text_color: (row.format == "link")?"blue":"#ffffff",
             	newText: (row.format != "photo")?row.message.replace(/\[br\]/ig, "\r\n"):row.message,
             	bgColor: (!row.is_endUser)?"#84474a":"#871f28",
             	setLeft: (!row.is_endUser)?10:null,
             	setRight: (!row.is_endUser)?null:"10",
              text_visible: (row.format == "text")?true:false,
              photo_visible: (row.format == "photo")?true:false,
              image_height: (row.format == "photo")?200:0,
              voice_visible: (row.format == "voice")?true:false,
              image: (row.format == "photo")?row.message:"",
              voice: (row.format == "voice")?row.voice:""
          	};
            Alloy.Globals.mocx.createCollection("chats", data_source);
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

function getPreviousData(param){

	start = (typeof start != "undefined")? start : 0;
	var model = Alloy.createCollection("conversations");
	console.log(args.u_id+" args.u_id");
	data = model.getData(false, start, anchor,"", args.u_id, room_id);
	console.log("get previous data");
	console.log(data.length);
	last_update = (data.length > 0)?_.last(data)['created']:last_update;
	render_conversation(false, false);
	start = start + 10;
}

function getLatestData(local){
	var model = Alloy.createCollection("conversations");
	//model.getData(false, start, last_update,"", args.u_id);
	data = model.getData(true,"","", last_update, args.u_id, room_id);
	console.log("get latest data");
	console.log(data.length);
	render_conversation(true, local);
	//setTimeout(function(e){scrollToBottom();}, 500);
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
	Alloy.Collections.chats.fetch();
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
  if(OS_IOS){
	   var total = (OS_ANDROID)?pixelToDp(e.y): e.contentOffset.y;
	   var nearEnd = (e.contentSize.height-$.chatroom.rect.height) - 200;

     if(total <= 0 && !data_loading && !first_time_load){
   		data_loading = true;
   		getPreviousData();
   		setTimeout(function(){
   			data_loading = false;
   		}, 2000);
   	}
  }else{
    var firstVisibleItemIndex = e.firstVisibleItem;
    var totalItems = e.totalItemCount;
    var visibleItemCount = e.visibleItemCount;
    //if ((firstVisibleItemIndex + visibleItemCount) >= (totalItems*0.75) && !data_loading && !first_time_load){
     if(firstVisibleItemIndex <= 0 && !data_loading && !first_time_load){
      data_loading = true;
      getPreviousData();
      setTimeout(function(){
        data_loading = false;
      }, 2000);
    }
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
        COMMON.createAlert("Error", "This chatroom is already ended.", function(e){
            closeWindow();
        });
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
}

init();

function patient_last_update(e){
    opposite_online = e.online;
    opposite_last_update = e.last_update;
    //updateReadStatus();
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
