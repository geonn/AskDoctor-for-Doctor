/**
 * Audio Player Widget
 * @author Mads Møller
 * (c) 2014 Napp ApS
 */

var args = arguments[0] || {};
var audioPlayer;// = Ti.Media.createAudioPlayer();
var timer;
// save off current idle timer state
Ti.App.idleTimerDisabled = true;

var idleTimer = Ti.App.idleTimerDisabled;
var sliderTouched = false;
var sliderIsPausingPlayback = false;
var timerIsActive = false;
var totalDisplayDuration;
var playIcon;
var pauseIcon;

// parsing styles from TSS
_.each(args.styles, function(value, property) {
	if ( typeof value === 'object') {
		$[property].applyProperties(value);
		delete args.styles[property];
	}
});
delete args.styles;

// parse icon arguments
if(args.playIcon){
	playIcon = WPATH("/images/play_button.png");
}
if(args.pauseIcon){
	pauseIcon = WPATH("/images/pause_button.png");
}

function onPlayStopBtnClicked() {

	// If both are false, playback is stopped.
	console.log(audioPlayer.playing+" audioPlayer.playing");
	if (audioPlayer.playing) {
		audioPlayer.pause();
		$.time.text = "Pause";
		Ti.Media.audioSessionCategory = Ti.Media.AUDIO_SESSION_CATEGORY_SOLO_AMBIENT;
		$.playStopBtn.image = playIcon;
	} else {
		try{
			audioPlayer.start();
		}catch(e){
			console.log("see what error here");
			console.log(e);
		}
		$.time.text = "Playing...";
		Ti.Media.audioSessionCategory = Ti.Media.AUDIO_SESSION_CATEGORY_PLAYBACK;
		$.playStopBtn.image = pauseIcon;
	}
	//updateTimeLabel();
}

/**
 * Get the sound duration in miliseconds
 */
function getDuration() {
	if (OS_IOS) {
		console.log(audioPlayer.duration+" "+audioPlayer.time);
		console.log('should get this '+Math.ceil(audioPlayer.duration * 1000));
		return Math.ceil(audioPlayer.duration * 1000);
	}
	return Math.ceil(audioPlayer.duration);
}

/**
 * prettifyTime
 * @param {String} time in seconds
 * @return {String} pretty time
 */
function prettifyTime(time) {
	console.log(time+" time");
	time = Math.floor(time);
	// find minutes and seconds
	var minutes = Math.floor(time / 60);
	var seconds = time - minutes * 60;
	return padLeft(minutes, 2) + ":" + padLeft(seconds, 2);
}

function padLeft(nr, n, str) {
	return Array(n - String(nr).length + 1).join(str || '0') + nr;
}

function updateTimeLabel() {
	// calc the duration - only once started
	$.time.text = (audioPlayer.playing)?"Playing...":"";
	return;

	totalDisplayDuration = prettifyTime(getDuration() / 1000);

	$.time.text = totalDisplayDuration;
}

exports.setUrl = function(url) {
    console.log("exports setUrl");
	var protocol = url.split('/')[0];
	if(protocol == "file:"){
		set_url(url);
		return;
	}
	var filename = url.split('/').pop();
	var folder = Titanium.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, args.room_id);
	if(!folder.exists()){
	    folder.createDirectory();
	}
	var file_temp = Titanium.Filesystem.getFile(folder.resolve(), filename);
	if(file_temp.exists()){
	    console.log('b');
	    console.log(file_temp.nativePath+" exist");
	    set_url(file_temp.nativePath);
	}else{
  		var xhr = Titanium.Network.createHTTPClient({
  			onload: function() {
  				// first, grab a "handle" to the file where you'll store the downloaded data
  				//var f = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, filename);
					console.log("download the file");
  				      file_temp.write(this.responseData); // write to the file
					console.log(file_temp.nativePath+" exist");
  				set_url(file_temp.nativePath);
  			},
  			timeout: 10000
  		});
  		xhr.open('GET', url);
  		xhr.send();
		}
};

function set_url(url){
	console.log(url+" here url");
	try{
		if(OS_IOS){
		    Ti.Media.audioSessionCategory = Ti.Media.AUDIO_SESSION_CATEGORY_SOLO_AMBIENT;
		}/*else{
			audioPlayer = Ti.Media.createAudioPlayer({
				url : url,
				allowBackground : true
			});
		}*/
		audioPlayer = Ti.Media.createAudioPlayer({
            url : url,
            allowBackground : true
        });
    console.log(audioPlayer.volume+"sound volume");
    audioPlayer.volume = 1;
    audioPlayer.release();
    console.log(audioPlayer.volume+"sound volume new");
	}catch(e){
		console.log(e.message);
	}/*
	audioPlayer.start();
	audioPlayer.stop();
	if (Ti.Platform.name === 'android'){
			audioPlayer.release();
	}*/
	// new sound - update the display
	//updateTimeLabel();

	// update the icon
	$.playStopBtn.image = playIcon;

	audioPlayer.addEventListener('change', function(e) {
		console.log('State: ' + e.description + ' (' + e.state + ')');
	    Ti.API.info('State: ' + e.description + ' (' + e.state + ')');
	    //updateTimeLabel();
	    if(e.state == 7){	//7 = stopped
	    	  image = playIcon;
	    }else if(e.state == 5){    //7 = stopped
            $.time.text = "";
            image = playIcon;
        }else if(e.state == 2){
			$.time.text = "Pause";
		}else if(e.state == 3){
			$.time.text = "Playing...";
		}
	});

	audioPlayer.addEventListener("complete", function(e){
		$.playStopBtn.image = playIcon;
        audioPlayer.release();
        console.log("audio release");
		$.time.text = "";
		Ti.Media.audioSessionCategory = Ti.Media.AUDIO_SESSION_CATEGORY_SOLO_AMBIENT;
	});
}

exports.updatePlayIcon = function(icon) {
	playIcon = icon;
};

exports.updatePauseIcon = function(icon) {
	pauseIcon = icon;
};

// call dispose when done
exports.dispose = function() {
	console.log("[AudioPlayerWidget] was disposed, idleTimer reset to = " + idleTimer);

	// always stop the player
	audioPlayer.stop();

	// release it
	if (OS_ANDROID) {
		audioPlayer.release();
	}

	// restore previous idle state when closed
	Ti.App.idleTimerDisabled = idleTimer;
};
args.win.addEventListener("close", function(){
});

// EVENTS
exports.addEventListener = $.on;
exports.removeEventListener = $.off;
exports.fireEvent = $.trigger;
