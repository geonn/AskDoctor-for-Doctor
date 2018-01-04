exports.definition = {
	config: {
		columns: {
		    "id": "INTEGER", 
		    "fullname": "TEXT", 
		    "username": "TEXT",
		    "mobile": "TEXT",
		    "email": "TEXT",
		    "img_path": "TEXT",
		    "point": "INTEGER", 
		},
		adapter: {
			type: "sql",
			collection_name: "user",
			idAttribute: "id"
		}
	},
	extendModel: function(Model) {
		_.extend(Model.prototype, {
			// extended functions and properties go here
		});

		return Model;
	},
	extendCollection: function(Collection) {
		_.extend(Collection.prototype, {
			// extended functions and properties go here
			 
			getUserById : function(id){
				var collection = this;
                var sql = "SELECT * FROM " + collection.config.adapter.collection_name + " WHERE id='"+ id+ "'" ;
                
                db = Ti.Database.open(collection.config.adapter.db_name);
                if(Ti.Platform.osname != "android"){
                	db.file.setRemoteBackup(false);
				}
                //	return;
                var res = db.execute(sql);
                var arr = []; 
               
                if (res.isValidRow()){
					arr = {
						id: res.fieldByName('id'),
					    fullname: res.fieldByName('fullname'),
					    username: res.fieldByName('username'),
					    mobile: res.fieldByName('mobile'),
					    email: res.fieldByName('email'),
					    img_path: res.fieldByName('img_path'),
					    point: res.fieldByName('point'),
					};
				} 
		 
				res.close();
                db.close();
                collection.trigger('sync');
                return arr;
			},
			getPoint : function(){
				var collection = this;
				var u_id = Ti.App.Properties.getString('user_id') || 0;
                var sql = "SELECT * FROM " + collection.config.adapter.collection_name + " WHERE id=?" ;
                
                db = Ti.Database.open(collection.config.adapter.db_name);
                if(Ti.Platform.osname != "android"){
                	db.file.setRemoteBackup(false);
				}
                //	return;
                var res = db.execute(sql, u_id);
                var point; 
               
                if (res.isValidRow()){
					point = res.fieldByName('point') || 0;
				} 
		 
				res.close();
                db.close();
                collection.trigger('sync');
                return point;
			},
			getData : function(e){
				var collection = this;
				var columns = collection.config.columns;
				var names = [];
				for (var k in columns) {
	                names.push(k);
	            }
	            
	            if(e.latest){
					var start_limit = "";
					var sql_lastupdate = " AND created > '"+e.anchor+"'";
				}else{
					var start_limit = " limit "+e.start+", 8";
					var sql_lastupdate = " AND created <= '"+e.anchor+"'";
				}
				var sql_uid = "";
				console.log(e);
				if(typeof e.u_id != "undefined"){
					sql_uid = " AND u_id = "+e.u_id;
				}
	            var sql_keyword = (typeof e.keyword != "undefined" && e.keyword != "")?" AND description like '%"+e.keyword+"%'":"";
	            var sql_category = (typeof e.category_id != "undefined")?" AND category = '"+e.category_id+"'":"";
                var sql = "SELECT * FROM " + collection.config.adapter.collection_name+" WHERE status = 1 "+sql_lastupdate+sql_category+sql_keyword+sql_uid+" order by `updated` DESC "+start_limit;
                console.log(sql);
                db = Ti.Database.open(collection.config.adapter.db_name);
                if(Ti.Platform.osname != "android"){
                	db.file.setRemoteBackup(false);
                }
                console.log(sql);
                var res = db.execute(sql);
                var arr = []; 
                var count = 0;
                
                while (res.isValidRow()){
                	var row_data = {};
	            	for (var i=0; i < names.length; i++) {
	            		row_data[ names[i] ] = res.fieldByName(names[i]);
					};
                	arr[count] = row_data;
                	res.next();
					count++;
                console.log(row_data)
                }
				res.close();
                db.close();
                
                collection.trigger('sync');
                return arr;
			},
            saveArray : function(arr){ // 5.1th version of save array by onn
				var collection = this;
				var columns = collection.config.columns;
				var names = [];
				for (var k in columns) {
	                names.push(k);
	            }
                db = Ti.Database.open(collection.config.adapter.db_name);
                if(Ti.Platform.osname != "android"){
                	db.file.setRemoteBackup(false);
                }
                console.log(arr.length+" number of arr to save into "+ collection.config.adapter.db_name);
                db.execute("BEGIN");
                arr.forEach(function(entry) {
                	var keys = [];
                	var eval_values = [];
                	for(var k in entry){
	                	if (entry.hasOwnProperty(k)){
	                		_.find(names, function(name){
	                			if(name == k){
	                				keys.push(k);
	                				entry[k] = (entry[k] == null)?"":entry[k];
	                				entry[k] = entry[k].replace(/'/g, "\\'");
			                		eval_values.push("\""+entry[k]+"\"");
	                			}
	                		});
	                	}
                	}
		            var sql_query =  "INSERT OR REPLACE INTO "+collection.config.adapter.collection_name+" ("+keys.join()+") VALUES ("+eval_values.join()+")";
		            console.log(sql_query);
		            db.execute(sql_query);
				});
				db.execute("COMMIT");
	            db.close();
	            collection.trigger('sync');
			},
			addColumn : function( newFieldName, colSpec) {
				var collection = this;
				var db = Ti.Database.open(collection.config.adapter.db_name);
				if(Ti.Platform.osname != "android"){
                	db.file.setRemoteBackup(false);
                }
				var fieldExists = false;
				resultSet = db.execute('PRAGMA TABLE_INFO(' + collection.config.adapter.collection_name + ')');
				while (resultSet.isValidRow()) {
					if(resultSet.field(1)==newFieldName) {
						fieldExists = true;
					}
					resultSet.next();
				}  
			 	if(!fieldExists) { 
					db.execute('ALTER TABLE ' + collection.config.adapter.collection_name + ' ADD COLUMN '+newFieldName + ' ' + colSpec);
				}
				db.close();
			}
		});

		return Collection;
	}
};