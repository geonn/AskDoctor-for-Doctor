/*********************
*** SETTING / API ***
**********************/
var API_DOMAIN = "plux.freejini.com.my";
// APP authenticate user and key
var USER  = 'freejini';
var KEY   = '06b53047cf294f7207789ff5293ad2dc';

//API that call in sequence 
var APILoadingList = [
	{url: "dateNow", type: "api_function", method: "sync_server_time"},
	{url: "getMessage", type: "api_model", model: "room", checkId: "0", params: {is_doctor: 1}},
];

/*********************
**** API FUNCTION*****
**********************/

exports.loadAPIBySequence = function (e){ //counter,
	var counter = (typeof e.counter == "undefined")?0:e.counter;
	console.log(counter+" "+APILoadingList.length);
	if(counter >= APILoadingList.length){
		Ti.App.fireEvent('app:loadingViewFinish');
		console.log("fired?");
		return false;
	}
	
	var api = APILoadingList[counter];
	var checker = Alloy.createCollection('updateChecker'); 
	var isUpdate = checker.getCheckerById(api['checkId']);
	var dr_id = Ti.App.Properties.getString('dr_id');
	var params = {dr_id: dr_id};
	
	if(isUpdate != "" && last_update_on){
		params = _.extend(params,  {last_updated: isUpdate.updated});
	}
	
	params = _.extend(params,  api['params']);
	console.log("check here");
	console.log(params);
	var url = api['url'];
	console.log(url);
	API.callByPost({
		url: url,
		params: params
	},{
		onload: function(responseText){
			if(api['type'] == "api_function"){
				eval("_.isFunction("+api['method']+") && "+api['method']+"(responseText)");
			}else if(api['type'] == "api_model"){
				var res = JSON.parse(responseText);
				var arr = res.data; 
		       	var model = Alloy.createCollection(api['model']);
		        model.saveArray(arr);
		        checker.updateModule(APILoadingList[counter]['checkId'],APILoadingList[counter]['model'], res.last_updated, dr_id);
			}
			Ti.App.fireEvent('app:update_loading_text', {text: APILoadingList[counter]['model']+" loading..."});
			counter++;
			API.loadAPIBySequence({counter: counter});
		},
		onerror: function(err){
			Ti.App.fireEvent('app:update_loading_text', {text: APILoadingList[counter]['model']+" loading..."});
			counter++;
			API.loadAPIBySequence({counter: counter});
		}
	});
};

// call API by post method
exports.callByPost = function(e, handler){
	
	var url = "https://"+API_DOMAIN+"/api/"+e.url+"?user="+USER+"&key="+KEY;
	console.log(url);
	console.log(e.params);
	if(e.type == "voice"){
		var _result = contactServerByPostVideo(url, e.params || {});  
	}else{
		var _result = contactServerByPost(url, e.params || {});  
	}
	_result.onload = function(ex) {  
		console.log(this.responseText);
		try{
			JSON.parse(this.responseText);
		}
		catch(e){
			console.log(this.responseText);
			console.log('callbypost JSON exception');
			console.log(e);
			COMMON.createAlert("Error", e.message, handler.onexception);
			return;
		}
		_.isFunction(handler.onload) && handler.onload(this.responseText); 
	};
	
	_result.onerror = function(ex) {
		//-1001	The request timed out.
		if(ex.code == "-1009"){		//The Internet connection appears to be offline.
			COMMON.createAlert("Error", ex.error, handler.onerror);
			return;
		}
		COMMON.createAlert("Error", ex.error, handler.onerror);
		/*
		if(_.isNumber(e.retry_times)){
			console.log(e.retry_times);
			e.retry_times --;
			if(e.retry_times > 0){
				API.callByPost(e, handler);
			}else{
				console.log('onerror msg');
				console.log(ex);
				COMMON.createAlert("Error", ex.error, handler.onerror);
			}
		}else{
			console.log('onerror msg without no');
			console.log(ex);
			e.retry_times = 2;
			API.callByPost(e, handler);
		}*/
	};
};

// call API by post method
exports.callByPostImage = function(e, onload, onerror) { 
	var client = Ti.Network.createHTTPClient({
		timeout : 5000
	});
	var url = eval(e.url);
	var _result = contactServerByPostImage(url, e.params || {});
	_result.onload = function(e) { 
		console.log('success');
		onload && onload(this.responseText); 
	};
	
	_result.onerror = function(ex) { 
		console.log("onerror");
		API.callByPostImage(e, onload);
		//onerror && onerror();
	};
};

// update user device token
exports.updateNotificationToken = function(e){
	var device_token = Ti.App.Properties.getString('deviceToken');
	var u_id = Ti.App.Properties.getString('dr_id');
	API.callByPost({url: "updateDoctorDeviceToken", params: {u_id: u_id, device_id: device_token}}, {onload: function(res){console.log(res);}});
};

/*********************
 * Private function***
 *********************/
function sync_server_time(responseText){
	var res = JSON.parse(responseText);
	console.log("sync_server_time");
	console.log(res);
	if(res.status != "error"){
		COMMON.sync_time(res.data);
	}
}

function contactServerByGet(url) { 
	var client = Ti.Network.createHTTPClient({
		timeout : 30000
	});
	client.open("GET", url);
	client.send(); 
	return client;
};

function contactServerByPost(url,records) { 
	var client = Ti.Network.createHTTPClient({
		timeout : 30000
	});
	/*if(OS_ANDROID){
	 	client.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded'); 
	 }*/
	client.open("POST", url);
	client.send(records);
	return client;
};

function contactServerByPostVideo(url,params) { 
	var client = Ti.Network.createHTTPClient({
		timeout : 50000
	});
	 
	//client.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');  
	client.open("POST", url);
	client.onsendstream = function(e) {
	    console.log( Math.floor(e.progress * 100) + "%");
	};
	client.send(params); 
	return client;
};


function contactServerByPostImage(url, records) { 
	var client = Ti.Network.createHTTPClient({
		timeout : 30000
	});
	client.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');  
	client.open("POST", url);
	client.send(records); 
	return client;
};

function onErrorCallback(e) { 
	// Handle your errors in here
	COMMON.createAlert("Error", e);
};
