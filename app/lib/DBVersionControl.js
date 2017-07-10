/*********************
*** DB VERSION CONTROL ***
* 
* Latest Version 1.9
* 
**********************/

// update user device token
exports.checkAndUpdate = function(e){
	var dbVersion = Ti.App.Properties.getString("dbVersion") || "1.1"; 
	if (dbVersion == '1.0') {
	  // do 1.1 upgrade
		var model = Alloy.createCollection('room'); 
		model.addColumn("unread", "INTEGER");
		dbVersion = '1.1';
	}
	Ti.App.Properties.setString("dbVersion", dbVersion);
};

