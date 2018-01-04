var args = arguments[0] || {};


Alloy.Globals.Navigator = {
	/**
	 * Handle to the Navigation Controller
	 */
	navGroup: $.nav,
	
	open: function(controller, payload){
		var controller = Alloy.createController(controller, payload || {});
		var win = controller.getView();
		if(OS_IOS){
			_.debounce(this.navGroup.openWindow(win), 1000, true);
			
		}else{
			// added this property to the payload to know if the window is a child
			if(typeof payload != "undefined"){
				if (payload.displayHomeAsUp){
					win.addEventListener('open',function(evt){
						var activity=win.activity;
						activity.actionBar.displayHomeAsUp=payload.displayHomeAsUp;
						activity.actionBar.onHomeIconItemSelected=function(){
							evt.source.close();
						};
					});
				}
			}
			_.debounce(win.open({navBarHidden: false, fullscreen: false}), 1000, true);
			
		}
		return controller;
	},
	openWindow: function(win){
		if(OS_IOS){
			this.navGroup.openWindow(win);
		}
		else{
			// added this property to the payload to know if the window is a child
			if(typeof payload != "undefined"){
				if (payload.displayHomeAsUp){
					win.addEventListener('open',function(evt){
						var activity=win.activity;
						activity.actionBar.displayHomeAsUp=payload.displayHomeAsUp;
						activity.actionBar.onHomeIconItemSelected=function(){
							evt.source.close();
						};
					});
				}
			}
			win.open({navBarHidden: false, fullscreen: false});
		}
	}
};

if(!OS_IOS){
	Alloy.Globals.Navigator.navGroup = $.index.getView();
}

function init(){
	var user = require("user"); 
	user.checkAuth(_callback);
	PUSH.setInApp();
	
}

var loadingView;

function loadingViewFinish(){
	console.log("finish!");
	loadingView.finish(function(){
		console.log("loadingview_finish!");
		Alloy.Globals.Navigator.navGroup.open({navBarHidden: true, fullscreen: false});
		Ti.App.fireEvent("home:refresh");
	});
}
Ti.App.addEventListener('app:loadingViewFinish', loadingViewFinish);
Ti.App.addEventListener('app:_callback', _callback);
function _callback(){
	/*loadingView = Alloy.createController("loader");
	console.log("callback from login");
	loadingView.getView().open();
	loadingView.start();*/
	Alloy.Globals.Navigator.navGroup.open({navBarHidden: true, fullscreen: false});
	Ti.App.fireEvent("home:refresh");
}

init();