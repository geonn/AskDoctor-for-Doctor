var fullname;
var mobile;
var username; 

exports.checkAuth = function(_callback) {
	var dr_id = Ti.App.Properties.getString('dr_id'); 
	console.log(dr_id+" dr_id!");
	if(dr_id == "" || dr_id == null){
		var win = Alloy.createController("auth/login").getView();
    	win.open();
	} else {
		Ti.App.fireEvent("home:refresh");
    	_callback && _callback();
    }
};

exports.updateProfile = function(params, _callback){
	
};

exports.logout = function(_callback) {
	Ti.App.Properties.removeProperty('user_id');
	Ti.App.Properties.removeProperty('fullname');
	Ti.App.Properties.removeProperty('email');
	Ti.App.Properties.removeProperty('mobile');
	Ti.App.Properties.removeProperty('img_path');
	Ti.App.Properties.removeProperty('thumb_path');
	Ti.App.Properties.removeProperty('point');
	console.log('start callback');
	_callback && _callback();
};