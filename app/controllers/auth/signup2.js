var args = arguments[0] || {};
var loading = Alloy.createController("loading");
var dr_id = Ti.App.Properties.getString("dr_id");
console.log(dr_id);
$.camera.init({dr_id: dr_id});

function doSubmit(){
   //Ti.App.fireEvent("closeWindow");
   var forms = $.apc.getChildren();
   var apc = forms[2].getChildren();
   var apc_list = apc[1].getChildren();
   console.log(apc_list.length);
   if(apc_list.length > 0){
   	closeWindow();
   }else{
   	alert("Please upload your APC");
   }
}

function closeWindow(){
	$.win.close();
}

$.win.addEventListener("open", function(){
	alert(args.message);
});

$.win.addEventListener("close", function(){
	Ti.App.Properties.removeAllProperties();
});

$.win.addEventListener("androidback", function(){
	var forms = $.apc.getChildren();
   var apc = forms[2].getChildren();
   var apc_list = apc[1].getChildren();
   if(apc_list.length > 0){
   	closeWindow();
   }else{
   	alert("Please upload your APC");
   }
});
