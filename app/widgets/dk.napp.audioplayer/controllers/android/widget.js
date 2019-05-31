/**
 * Audio Player Widget
 * @author Mads Møller
 * (c) 2014 Napp ApS
 */
var Activity = require('android.app.Activity');
var AudioManager = require('android.media.AudioManager');
var MediaPlayer = require('android.media.MediaPlayer');
var Uri = require('android.net.Uri');

var args = arguments[0] || {};
var audioPlayer;
var timer;
var audioURL;
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
	if ($.time.text == "Playing...") {
		audioPlayer.pause();
		$.time.text = "Pause";
		$.playStopBtn.image = playIcon;
	}else if($.time.text == "Pause"){
		audioPlayer.start();
		$.time.text = "Playing...";
		$.playStopBtn.image = pauseIcon;
	}else if($.time.text == "Downloading..."){

	}else{
		audioPlayer = new MediaPlayer();
		audioPlayer.setOnCompletionListener(new MediaPlayer.OnCompletionListener({
				onCompletion: function(mediaPlayer){
						$.playStopBtn.image = playIcon;
						console.log("audio release");
						audioPlayer.reset();
						audioPlayer.release();
						$.time.text = "";
				}
		}));
		const activity = new Activity(Ti.Android.currentActivity);
	    const contentUri = Uri.parse(audioURL);
		audioPlayer.reset();
	    audioPlayer.setDataSource(activity.getApplicationContext(), contentUri);
		$.time.text = "Playing...";
		$.playStopBtn.image = pauseIcon;
		try{
	  	    audioPlayer.prepare();
		}catch(e){
			console.log("prepare fail");
			console.log(e);
			$.playStopBtn.image = playIcon;
			$.time.text = "";
			audioPlayer.reset();
            audioPlayer.release();
			return;
		}
		audioPlayer.setOnPreparedListener(new MediaPlayer.OnPreparedListener({
                onPrepared: function(mediaPlayer){
                    console.log("audio is prepared");
                    try{
                        mediaPlayer.start();
                    }catch(e){
                        console.log("start fail");
                        console.log(e);
                        audioPlayer.reset();
                        audioPlayer.release();
                        $.playStopBtn.image = playIcon;
                        $.time.text = "";
                    }
                }
        }));

	}
}

exports.setUrl = function(url) {
  console.log("exports setUrl");
	$.time.text = "Downloading...";
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
  			timeout: 50000
  		});
  		xhr.open('GET', url);
  		xhr.send();
		}
};

function set_url(url){
	console.log(url+" here url");
	$.time.text = "";
	audioURL = url;
	$.playStopBtn.image = playIcon;
}

exports.updatePlayIcon = function(icon) {
	playIcon = icon;
};

exports.updatePauseIcon = function(icon) {
	pauseIcon = icon;
};

args.win.addEventListener("close", function(){

});

// EVENTS
exports.addEventListener = $.on;
exports.removeEventListener = $.off;
exports.fireEvent = $.trigger;
