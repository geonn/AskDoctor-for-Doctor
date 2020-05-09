const io = require('ti.socketio');
const SERVER_IP = 'http://103.3.173.207:3501';
var socket_io = io.connect(SERVER_IP);
var room_id = 0;
var dr_id = 0;
var room_last_update = [];
var connection = false;
var pending_task = [];

function doConnect(){
	
	console.log(connection+" doConnect online status = "+socket_io.connected);
	
	if(!socket_io.connected && !connection){
		connection = true;
		console.log("socket_io.connect");
		socket_io = io.connect(SERVER_IP);
		
		socket_io.on('disconnect', function(reason){
		  console.log("disconnect "+reason);
		  //socket_io.open();
		  socket_io.close();
		  connection = false;
		  Ti.App.fireEvent("socket_dc");
		  
		});
		socket_io.on('connect_error', function(attemptNumber){
		  console.log("connect_error "+attemptNumber+" roomid = "+room_id);
		  //setRoom({room_id: room_id});
		  connection = false;
		});
		socket_io.on('connect_timeout', function(attemptNumber){
		  console.log("connect_timeout "+attemptNumber+" roomid = "+room_id);
		  connection = false;
		  doConnect();
		  //setRoom({room_id: room_id});
		});
		socket_io.on('reconnect', function(attemptNumber){
		  console.log("reconnect "+attemptNumber+" roomid = "+room_id);
		  connection = false;
		  //setRoom({room_id: room_id});
		});
		socket_io.on('connect', function () {
		    console.log(socket_io.id+" socket connected ");
		    connection = false;
		    if(room_id > 0){
		    	setRoom({room_id: room_id});
		    }
		    Ti.App.fireEvent("socket_online");
		    if(pending_task.length > 0){
		    	console.log(pending_task);
		    	console.log(pending_task.length+" pending_task");
		    		for(var i=0,j=pending_task.length; i<j; i++){
		    			console.log(pending_task[i]);
				  	pending_task[i].func(pending_task[i].params);
				};
			pending_task = [];	
		    }
		    
		    socket_io.on("socket:doctor_last_update", function(params){
			    console.log("socket:doctor_last_update");
			    Ti.App.fireEvent("socket:doctor_last_update", params);
			});
			socket_io.on("socket:user_last_update", function(params){
			    console.log("socket_on:user_last_update");
			    console.log(params);
			    Ti.App.fireEvent("socket:user_last_update", params);
			});
			socket_io.on('doctor:refresh_patient_list', function(){
			    console.log("event listener doctor:refresh_patient_list");
			    Ti.App.fireEvent("doctor:refresh_patient_list");
			});
			
			socket_io.on('socket:refresh_chatroom', function(param){ 
			    console.log("event listener socket:refresh_chatroom");
			    Ti.App.fireEvent("socket:refresh_chatroom", param);
			});
			
			socket_io.on("socket:getDoctorList", function(param){
			    console.log("event listener socket:getDoctorList");
			    Ti.App.fireEvent("controller:getDoctorList", param);
			});
		});
		//
	}else{
		console.log("socket is online");
	}
}


exports.getLastUpdateByRoom = getLastUpdateByRoom;

function getLastUpdateByRoom(room_id){
    if(typeof room_last_update["t_"+room_id] != "undefined"){
        return room_last_update["t_"+room_id];
    }else{
        return false;
    }
}

exports.getDoctorList = getDoctorList;

function getDoctorList(ex){
    console.log(socket_io.connected+" getDoctorList");
    if(socket_io.connected){
        socket_io.emit('socket:getDoctorList', socket_io.id);
    }else{
		pending_task.push({func: getDoctorList, params: ex});
		doConnect();
	}
}

exports.startTimer = startTimer;

function startTimer(ex){
    if(socket_io.connected){
        socket_io.emit('socket:startTimer', ex.room_id);
        console.log("socket:startTimer "+ex.room_id);
    }else{
		pending_task.push({func: startTimer, params: ex});
		doConnect();
    }
}

exports.checkOnline = checkOnline;
function checkOnline(){
   doConnect();
    //update_room_member_time({last_update: COMMON.now(),u_id: 0, room: room_id, online: true}){
}

exports.disconnect = disconnect;
function disconnect(){
  //update_room_member_time({last_update: COMMON.now(),u_id: 0, room: room_id, online: false}){
    socket_io.close();
    socket_io.disconnect();
}

exports.update_room_member_time = update_room_member_time;

function update_room_member_time(ex){
    console.log(socket_io.connected+" update_room_member_time");
    if(socket_io.connected){
        socket_io.emit((OS_IOS)?'update_room_member_time':"update_room_member_time",
        {id: socket_io.id, last_update: ex.last_update, u_id: ex.u_id, room_id: ex.room_id, online: ex.online});
    }else{
		pending_task.push({func: update_room_member_time, params: ex});
		doConnect();
    }
}

exports.join_special_room = join_special_room;

function join_special_room(ex){
    console.log(socket_io.connected+" join_special_room");
    if(socket_io.connected){
        socket_io.emit((OS_IOS)?'join_special_room':"join_special_room", {id: socket_io.id, name: ex.name, dr_id: ex.dr_id, room: 'doctor'});
        console.log({id: socket_io.id, name: ex.name, dr_id: ex.dr_id, room: 'doctor'});
    }else{
		pending_task.push({func: join_special_room, params: ex});
		doConnect();
    }
}

exports.leave_special_room = leave_special_room;

function leave_special_room(ex){
    console.log(socket_io.connected+" leave_special_room");
    if(socket_io.connected){
        socket_io.emit((OS_IOS)?'leave_special_room':"leave_special_room", {id: socket_io.id, name: ex.name, dr_id: ex.dr_id, room: 'doctor'});
        console.log({id: socket_io.id, name: ex.name, dr_id: ex.dr_id, room: 'doctor'});
    }else{
		pending_task.push({func: leave_special_room, params: ex});
		doConnect();
    }
}

exports.setRoom = setRoom;

function setRoom(ex){
    console.log(socket_io.connected+" setRoom");
    room_id = ex.room_id;
    var dr_id = Ti.App.Properties.getString('dr_id') || 0;
    if(socket_io.connected){
        socket_io.emit((OS_IOS)?'set_room2':"set_room2", {room_id: ex.room_id, role: "doctor", u_id: dr_id, last_update: COMMON.now(), online: true});
        console.log("set_room "+ex.room_id);
    }else{
		pending_task.push({func: setRoom, params: ex});
		doConnect();
    }
}

exports.refresh_patient_list = refresh_patient_list;

function refresh_patient_list(ex){
    console.log(socket_io.connected+" refresh_patient_list");
    if(socket_io.connected){
        socket_io.emit('doctor:refresh_patient_list');
    }else{
		pending_task.push({func: refresh_patient_list, params: ex});
		doConnect();
    }
}

exports.sendMessage = sendMessage;

function sendMessage(ex){
    console.log(socket_io.connected+" sendMessage");
    if(socket_io.connected){
        socket_io.emit((OS_IOS)?'socket:refresh_chatroom_2':"socket:refresh_chatroom_2", ex.room_id, ex.msg);
        console.log("sendMessage at room "+ex.room_id);
        ex.callback();
    }else{
		pending_task.push({func: sendMessage, params: ex});
		doConnect();
    }
}

exports.leave_room = leave_room;

function leave_room(ex){
    console.log(socket_io.connected+" leave_room");
    if(socket_io.connected){
        socket_io.emit((OS_IOS)?'leave_room':"leave_room", ex.room_id);
        console.log("leave_room "+ex.room_id);
    }else{
		pending_task.push({func: leave_room, params: ex});
		doConnect();
    }
}
