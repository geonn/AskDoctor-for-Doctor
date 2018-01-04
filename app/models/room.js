exports.definition = {
	config: {
		columns: {
		    "room_id": "INTEGER PRIMARY KEY",
		    "u_id": "INTEGER",
		    "sender_id": "INTEGER",
		    "sender_name": "TEXT",
		    "patient_name": "TEXT",
		    "message": "TEXT",
		    "created": "DATE",
		    "updated": "DATE",
		    "status":"INTEGER",		//1 - pending, 2 - sent, 3 - read
		    "format":"TEXT",
		    "dr_id":"INTEGER",
		    "is_endUser": "INTEGER",
		    "unread": "INTEGER"
		},
		adapter: {
			type: "sql",
			collection_name: "room",
			idAttribute: "room_id"
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
			
			getData: function(latest, start, anchor, last_id, u_id){
				//var last_update = last_update || common.now();
				if(latest){
					/*var a = last_update;
					a = a.replace("  "," ");
					var b = a.split(" ");
					 */
					var start_limit = "";
					//var sql_lastupdate = " AND created > '"+b[0]+" "+b[1]+"'";
					var sql_lastupdate = "";
					var sql_id = " AND id > "+last_id;
				}else{
					var start_limit = " limit "+start+", 10";
					var sql_lastupdate = " AND created <= '"+anchor+"'";
					var sql_id = "";
				}
				
				var collection = this;
				var dr_id = Ti.App.Properties.getString('dr_id'); 
                var sql = "SELECT * from room where dr_id = ? "+sql_lastupdate+sql_id+" AND u_id=? order by created desc"+start_limit ; 
                
                db = Ti.Database.open(collection.config.adapter.db_name);
                if(Ti.Platform.osname != "android"){
                	db.file.setRemoteBackup(false);
                }
            	
            	var res = db.execute(sql, dr_id, u_id);
               	var arr = [];
                var count = 0;
                 /**
                 * debug use
                 
                var row_count = res.fieldCount;
               /** for(var a = 0; a < row_count; a++){
            		 console.log(a+":"+res.fieldName(a)+":"+res.field(a));
            	 }
            	*/
                while (res.isValidRow()){
					arr[count] = {
					    id: res.fieldByName('id'),
					    u_id: res.fieldByName('u_id'),
					    sender_id: res.fieldByName('sender_id'),
					    message: res.fieldByName('message'),
					    status: res.fieldByName('status'),
					    dr_id: res.fieldByName('dr_id'),
					    created: res.fieldByName('created'),
					    format: res.fieldByName("format"),
					    is_endUser: res.fieldByName('is_endUser'),
					    unread: res.fieldByName("unread"),
					    sender_name: res.fieldByName('sender_name')
					};
					res.next();
					count++;
				} 
			 
				res.close();
                db.close();
                collection.trigger('sync');
                return arr;
			},
			getUserData: function(){
				
				var collection = this;
				var columns = collection.config.columns;
				var names = [];
				for (var k in columns) {
	                names.push(k);
	            }
				var dr_id = Ti.App.Properties.getString('dr_id'); 
                var sql = "SELECT * from room where dr_id = ? order by created AND status desc"; 
                
                db = Ti.Database.open(collection.config.adapter.db_name);
                if(Ti.Platform.osname != "android"){
                	db.file.setRemoteBackup(false);
                }
            	
            	var res = db.execute(sql, dr_id);
               	var arr = [];
                var count = 0;
                 /**
                 * debug use
                 **/
                var row_count = res.fieldCount;
                for(var a = 0; a < row_count; a++){
            		 console.log(a+":"+res.fieldName(a)+":"+res.field(a));
            	 }
            	
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
			removeById: function(m_id){
				var collection = this;
				
                db = Ti.Database.open(collection.config.adapter.db_name);
                if(Ti.Platform.osname != "android"){
                	db.file.setRemoteBackup(false);
                }
				var sql_query =  "DELETE FROM "+collection.config.adapter.collection_name+" WHERE id=?";
				db.execute(sql_query, m_id);
				console.log(db.getRowsAffected()+" deleted");
	            db.close();
	            collection.trigger('sync');
			},
			setColumnValue: function(){
				var collection = this;
				
                db = Ti.Database.open(collection.config.adapter.db_name);
                if(Ti.Platform.osname != "android"){
                	db.file.setRemoteBackup(false);
                }
				var sql_query =  "UPDATE "+collection.config.adapter.collection_name+" set dr_id = 0";
				db.execute(sql_query);
				console.log(db.getRowsAffected()+" deleted");
	            db.close();
	            collection.trigger('sync');
			},
			messageRead : function(entry){
				var collection = this;
				
                db = Ti.Database.open(collection.config.adapter.db_name);
                if(Ti.Platform.osname != "android"){
                	db.file.setRemoteBackup(false);
                }
				var sql_query =  "UPDATE "+collection.config.adapter.collection_name+" SET status=3 WHERE dr_id=?";
				db.execute(sql_query, entry.dr_id);
	            db.close();
	            collection.trigger('sync');
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
			},
			updateStatus: function(arr, status){
				var collection = this;
                var sql = "UPDATE conversation set status = ? WHERE id in(?)";
                db = Ti.Database.open(collection.config.adapter.db_name);
                if(Ti.Platform.osname != "android"){
                	db.file.setRemoteBackup(false);
                }
                db.execute(sql, status, arr);
                db.close();
                collection.trigger('sync');
			},
			V1_9DBupdate : function(){
				var collection = this;
                var sql = "UPDATE conversation set status = 2";
                db = Ti.Database.open(collection.config.adapter.db_name);
                if(Ti.Platform.osname != "android"){
                	db.file.setRemoteBackup(false);
                }
                db.execute(sql);
                db.close();
                collection.trigger('sync');
			},
			resetTable : function(){
				var collection = this;
                var sql = "DELETE FROM " + collection.config.adapter.collection_name ;
                db = Ti.Database.open(collection.config.adapter.db_name);
                if(Ti.Platform.osname != "android"){
                	db.file.setRemoteBackup(false);
                }
                db.execute(sql);
                db.close();
                collection.trigger('sync');
			}
		});

		return Collection;
	}
};