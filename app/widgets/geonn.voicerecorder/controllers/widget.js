var args = arguments[0] || {};
var timer = require(WPATH("timer"));
var audioRecorder;
var cancel_record = false;
var recording = false;
if(OS_ANDROID){
	audioRecorder = require("titutorial.audiorecorder");	
}else{
	console.log(Ti.Media.hasAudioPermissions()+" Ti.Media.hasAudioPermissions()");
	Ti.Media.audioSessionCategory = Ti.Media.AUDIO_SESSION_CATEGORY_PLAY_AND_RECORD;
	audioRecorder = Titanium.Media.createAudioRecorder ({compression : Ti.Media.AUDIO_FORMAT_AAC, format: Titanium.Media.AUDIO_FILEFORMAT_MP4});
}


function startRecording(){
	//$.message_bar.animate({right: 200, duration: 30});
	console.log("startRecording "+cancel_record);
	if(recording){
	    return;
	}
	recording = true;
	cancel_record = false;
	timer.start($.timer);
	$.text_area.width = Ti.UI.SIZE;
	$.timer.show();
	$.timer_text.show();
	if(OS_IOS){
	    Ti.Media.audioSessionCategory = Ti.Media.AUDIO_SESSION_CATEGORY_PLAY_AND_RECORD;
		console.log('here!!!');
		audioRecorder.start();
	}else{
		audioRecorder.startRecording(
			{
				outputFormat : audioRecorder.OutputFormat_MPEG_4,
				audioEncoder : audioRecorder.AudioEncoder_AMR_NB,
				directoryName : "plux",
				fileName : (Math.random() + 1).toString(36).substring(7),
				success : function(e) {
					//alert("success => " + e.filePath);
					console.log("response is => " + JSON.stringify(e));
			         
					var audioDir = (OS_ANDROID)?Titanium.Filesystem.getFile(Titanium.Filesystem.externalStorageDirectory, "plux"):Titanium.Filesystem.getFile(Titanium.Filesystem.tempDirectory);
					var audioFile = Ti.Filesystem.getFile(audioDir.resolve(), e.fileName);
					
					if(!cancel_record){
					    console.log("audioFile.nativePath = " + e.filePath);
						args.record_callback({message: e.filePath, format:"voice", filedata: audioFile.read()});
					}
				},
				error : function(d) {
					console.log("error is => " + JSON.stringify(d));
				}
			}
		);
	}
}

function stopRecording(e){
    console.log("stop recording");
    recording = false;
	try{
		var sec = timer.stop();
		if(sec <= 1){
			cancel_record = true;	
		}
		if(OS_IOS){
			var audioFile = audioRecorder.stop();
			console.log(audioFile);
			if(sec > 1)
				args.record_callback({message: audioFile.nativePath, format:"voice", filedata: audioFile.read()});
		}else{
			audioRecorder.stopRecording();
		}
		//$.message_bar.animate({right: 50, duration: 30});
		$.text_area.width = 0;
		$.timer_text.hide();
		$.timer.hide();
	}catch(e){
		console.log("error caught");
		cancel_record = true;
		if(OS_ANDROID){
			audioRecorder.stopRecording();
		};
		$.text_area.width = 0;
		$.timer_text.hide();
		$.timer.hide();
	};
}

// call dispose when done
function init() {
	$.timer.hide();
	$.timer_text.hide();
	$.text_area.width = 0;
	console.log(WPATH('images/icon_mic.png'));
	var img_mic = $.UI.create("ImageView", {image: WPATH('images/icon_mic.png'), backgroundColor:"#20243e", top: 10, bottom:10, zIndex:3, right: 10, height: 30, width: 30});
	img_mic.addEventListener("click", startRecording);
	//$.container.addEventListener("touchend", stopRecording);
	//$.container.addEventListener("touchcancel",stopRecording);
	$.container.add(img_mic);
};

function testing(){
    console.log("click liao");
}

function tesing2(){
    console.log("ended");
}

init();

// EVENTS
exports.addEventListener = $.on;
exports.removeEventListener = $.off;
exports.fireEvent = $.trigger; 
exports.startRecording = startRecording;
exports.stopRecording = stopRecording;