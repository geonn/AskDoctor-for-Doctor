var Activity = require('android.app.Activity');
var AudioManager = require('android.media.AudioManager');
var MediaPlayer = require('android.media.MediaPlayer');
var Uri = require('android.net.Uri');

var mMediaPlayer;

(function(container) {
	const activity = new Activity(Ti.Android.currentActivity);
	const contentUri = Uri.parse("https://plux.freejini.com.my/public/message_media/3/1/8/3/8/50fbb6867_2.mp4");

	mMediaPlayer = new MediaPlayer();
	mMediaPlayer.setOnCompletionListener(new MediaPlayer.OnCompletionListener({
		onCompletion: function(mediaPlayer){
			Ti.API.info('MediaPlayer playback completed');
		}
	}));
	mMediaPlayer.setAudioStreamType(AudioManager.STREAM_MUSIC);
	mMediaPlayer.setDataSource(activity.getApplicationContext(), contentUri);
	mMediaPlayer.prepare();
})($.window);

function startMedia() {
	mMediaPlayer.start();
}

function stopMedia() {
	mMediaPlayer.pause();

	// NOTE: You can also stop it, but then you have to prepare() it again as well
	// mMediaPlayer.stop();
	// mMediaPlayer.prepare();
}
