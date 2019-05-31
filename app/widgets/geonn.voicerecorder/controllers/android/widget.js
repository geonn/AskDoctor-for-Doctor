var args = arguments[0] || {};
var timer = require(WPATH("timer"));
var recording = false;

var MediaRecorder = require('android.media.MediaRecorder');
var recorder = new MediaRecorder();

var filename = Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 6)+".m4a";
var folder = Titanium.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, args.room_id);
if(!folder.exists()){
    folder.createDirectory();
}
var recordingPathFile = folder.resolve();
var recordingPath = recordingPathFile.slice(7) +"/"+filename;

function startRecording(){
	//$.message_bar.animate({right: 200, duration: 30});
	if(recording){
	    return;
	}
	Ti.Media.vibrate();
	recording = true;
	cancel_record = false;
	timer.start($.timer);
	$.text_area.width = Ti.UI.SIZE;
	$.timer.show();
	$.timer_text.show();

    recorder.setAudioSource(MediaRecorder.AudioSource.MIC);
    recorder.setOutputFormat(MediaRecorder.OutputFormat.MPEG_4);
    recorder.setAudioEncoder(MediaRecorder.AudioEncoder.AMR_NB);
    recorder.setOutputFile(recordingPath);
    try {
        recorder.prepare();
    }catch(e){
        console.log("prepare fail");
        console.log(e);
    }
    try {
        recorder.start();
    }catch(e){
        console.log("start fail");
        console.log(e);
    }
}

function stopRecording(e){
    recording = false;
    recorder.stop();
    //recorder.reset();
    var sec = timer.stop();
    if(sec > 1){
        var file_path = Titanium.Filesystem.getFile("file://"+recordingPath);
        if(file_path.exists()){
            args.record_callback({message: file_path.nativePath, format:"voice", filedata: file_path.read()});
        }else{
            console.log("not exist lo");
        }
    }
    $.text_area.width = 0;
    $.timer_text.hide();
    $.timer.hide();
}

// call dispose when done
function init() {
	$.timer.hide();
	$.timer_text.hide();
	$.text_area.width = 0;
	console.log(WPATH('images/icon_mic.png'));
	var img_mic = $.UI.create("ImageView", {image: WPATH('images/icon_mic.png'), backgroundColor:"#20243e", top: 10, bottom:10, zIndex:3, right: 10, height: 30, width: 30});
	img_mic.addEventListener("click", startRecording);
	img_mic.addEventListener("longpress", startRecording);
	$.container.add(img_mic);
};

init();

// EVENTS
exports.addEventListener = $.on;
exports.removeEventListener = $.off;
exports.fireEvent = $.trigger;
exports.startRecording = startRecording;
exports.stopRecording = stopRecording;
