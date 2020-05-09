var args = arguments[0] || {};
var loading = Alloy.createController("loading");

function doSubmit(){
    var forms_arr = $.forms.getChildren();
    var params = {};
    var error_message = "";
    for (var i=0; i < forms_arr.length - 2; i++) {
        
        if(forms_arr[i].format == "photo" && forms_arr[i].children[2].attached){
            _.extend(params, {Filedata: forms_arr[i].children[2].filedata});
        }else{
            if(forms_arr[i].ignore){
            	
            }else if(forms_arr[i].children[0].required && forms_arr[i].children[0].value == ""){
                error_message += forms_arr[i].children[0].hintText+" cannot be empty\n";
            }else{
                params[forms_arr[i].id] = forms_arr[i].children[0].value.trim();
            }
        }
        if(forms_arr[i].id == "password2"){
            if(forms_arr[i].children[0].value != forms_arr[i-1].children[0].value){
                error_message += "Your password are not match\n";
            }
        }
    };
    if(error_message != ""){
        alert(error_message);
        return;
    }
    loading.start();
    API.callByPost({url: "pluxDoctorRegister", params: params}, {onload: 
    	function(responseText){
    		var result = JSON.parse(responseText);
			console.log(result.status);
			if(result.status == "error"){
				COMMON.createAlert("Error", result.data);
				loading.finish();
				return false;
			}else{
				loading.finish();
				var arr = result.data;
				console.log(arr);
		   		_.each(result.data, function(value, key){
		            Ti.App.Properties.setString(key, value);
		        });
		        
				socket.join_special_room({name: arr.name, dr_id: arr.doctor_id});
		   		Ti.App.fireEvent("app:_callback", {from: "login"});
				$.win.close();
				var win = Alloy.createController("auth/signup2", {message: result.data.message}).getView();
				win.open();
				//Alloy.Globals.Navigator.navGroup.open({navBarHidden: true, fullscreen: false});
			}
		}
	});
    	
}

function textFieldOnBlur(e){
    if(e.source.required && e.source.value == ""){
        //error_message += forms_arr[i].hintText+" cannot be empty\n";
        e.source.parent.backgroundColor = "#e8534c";
    }else{
        e.source.parent.backgroundColor = "#55a939";
    }
    /*if(e.source.value==""){
        e.source.value = e.source.hintText;
        //e.source.color = "#06141c";
    }*/
}

function closeWindow(){
	$.win.close();
}
