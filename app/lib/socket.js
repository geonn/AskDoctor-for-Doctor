const io = require('ti.socketio');
const SERVER_IP = 'http://103.3.173.207:3501';
var socket_io;
var room_id = 0;
var dr_id = 0;
var isConnected = false;
 
function doConnect(){
    isConnected = true;
    socket_io = io.connect(SERVER_IP);
    
    socket_io.on('connect', function () {
        console.log(socket_io.id+" connect");
        if(room_id > 0){
            console.log('new_set_room'+room_id);
            socket_io.emit((OS_IOS)?'new_set_room':"set_room", room_id);
        }
        socket_io.emit('new_set_room', "doctor");
    });
    
    socket_io.on('disconnect', function () {
        console.log("disconnect");
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
}

exports.getDoctorList = getDoctorList; 

function getDoctorList(){
    console.log(isConnected+" getDoctorList");
    if(isConnected){
        socket_io.emit('socket:getDoctorList', socket_io.id);
    }else{
        doConnect();
        setTimeout(getDoctorList, 1000);
    }
}

exports.startTimer = startTimer; 

function startTimer(ex){
    socket_io.connect();
    if(isConnected){
        socket_io.emit('socket:startTimer', ex.room_id);
        console.log("socket:startTimer "+ex.room_id);
    }else{
        //socket_io.connect();
        setTimeout(function(){startTimer(ex);}, 1000);
    }
}

exports.connect = connect;
function connect(){
    doConnect();
}

exports.disconnect = disconnect;
function disconnect(){
    socket_io.close();
    socket_io.disconnect();
    isConnected = false;
    console.log(isConnected+" disconnect action");
}

exports.join_special_room = join_special_room; 

function join_special_room(ex){
    console.log(isConnected+" join_special_room");
    if(isConnected){
        socket_io.emit((OS_IOS)?'new_join_special_room':"join_special_room", {id: socket_io.id, name: ex.name, dr_id: ex.dr_id, room: 'doctor'});
        console.log({id: socket_io.id, name: ex.name, dr_id: ex.dr_id, room: 'doctor'});
    }else{
        doConnect();
        setTimeout(function(){join_special_room(ex);}, 1000);
    }
}

exports.leave_special_room = leave_special_room;

function leave_special_room(ex){
    console.log(isConnected+" leave_special_room");
    if(isConnected){
        socket_io.emit((OS_IOS)?'new_leave_special_room':"leave_special_room", {id: socket_io.id, name: ex.name, dr_id: ex.dr_id, room: 'doctor'});
        console.log({id: socket_io.id, name: ex.name, dr_id: ex.dr_id, room: 'doctor'});
    }else{
        doConnect();
        setTimeout(function(){leave_special_room(ex);}, 1000);
    }
}

exports.setRoom = setRoom;

function setRoom(ex){
    console.log(isConnected+" setRoom");
    room_id = ex.room_id;
    if(isConnected){
        socket_io.emit((OS_IOS)?'new_set_room':"set_room", ex.room_id);
        console.log("set_room "+ex.room_id);
    }else{
        doConnect();
        setTimeout(function(){setRoom(ex);}, 1000);
    }
}

exports.refresh_patient_list = refresh_patient_list;

function refresh_patient_list(ex){
    console.log(isConnected+" refresh_patient_list");
    if(isConnected){
        socket_io.emit('doctor:refresh_patient_list');
    }else{
        doConnect();
        setTimeout(function(){refresh_patient_list(ex);}, 1000);
    }
}

exports.sendMessage = sendMessage;

function sendMessage(ex){
    console.log(isConnected+" sendMessage");
    if(isConnected){
        socket_io.emit((OS_IOS)?'new_socket:refresh_chatroom':"socket:refresh_chatroom", ex.room_id, false);
        console.log("sendMessage at room "+ex.room_id);
    }else{
        doConnect(); 
        setTimeout(function(){sendMessage(ex);}, 1000);
    }
}

exports.leave_room = leave_room;

function leave_room(ex){
    console.log(isConnected+" leave_room");
    if(isConnected){
        socket_io.emit((OS_IOS)?'new_leave_room':"leave_room", ex.room_id);
        console.log("leave_room "+ex.room_id);
    }else{
        doConnect(); 
        setTimeout(function(){leave_room(ex);}, 1000);
    }
}