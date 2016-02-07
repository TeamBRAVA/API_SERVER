var mongo = require('mongoskin');
var async = require('async');
var util = require('util');


var db = mongo.db('mongodb://localhost/RED_DB');



/* PERMISSIONS MODEL
	
	{
		_id: ObjectId(),
		from: {
			collection: "user/device",
			id: ObjectId()  
		},
		to: {
			collection: "device/permission",
			id: ObjectId()  
		},
		permissions: {"temp": "read/write", "usage": "read/write", "key" : "type"},
		status : "granted/denied/pending"
	}

*/

/* All callback are in the form  : callback(err, result); */

var app = {

	/* 	obj : { from : [collection, id ], to : [ collection : id ], permissions : {"key" : "read/write" , ...} } 
		! the status is always pending after an insert !
	*/
	insert : function (obj, callback) {

		if( !(obj.from[0] == "device" || obj.from[0] == "user") ) {
			callback(new Error("Insert first argument must contain a 'from' field equals to 'device' or 'user'"));
			return;
		}
		if( !(obj.to[0] == "permission" || obj.to[0] == "device") ) {
			callback(new Error("Insert first argument must contain a 'to' field equals to 'device', 'user' or 'permission'"));
			return;
		}
		if( obj.to[0] == "device") {
			if( !(obj.permissions && obj.permissions instanceof Object && Object.keys(obj.permissions).length > 0) ) {
				callback(new Error("Insert first argument must contain a 'permissions' array containing all the accessible key to data"));
				return;
			}
		}

		var permission = {
			from : {
				collection : obj.from[0],
				id : obj.from[1]
			},
			to : {
				collection : obj.to[0],
				id : obj.to[1]
			},
			permissions : (obj.to[0] == "permission" ? null : obj.permissions),
			status : "pending"
		};

		db.collection('permission').insert(permission, function (err, result) {
	        if(err) {
	        	callback(err);
	        	return;
	        }
	        console.log("Permission inserted");
	        callback(err, result);
	    });

	},

	/*	remove a permission in the database, given it's id
		Access to this function need to be verified before use !! */
	remove : function (id, callback) {
		db.collection('permission').remove( { _id: mongo.helper.toObjectID(id) }, function (err, result) {
		    if (err) {
		    	callback(err);
		    	return;
		    }
		    console.log("Permission removed");
		    callback(err, result);
		});
	},

	/*	Add the granted flag to the permission 
		Access to this function must be verified before use !! */
	allow : function (id, callback) {
		db.collection('permission').update( { _id: mongo.helper.toObjectID(id) }, {'$set' : {status : 'granted'}}, function (err, result) {
			if(err) {
				callback(err);
				return;
			}
			console.log("Permission granted");
			callback(err, result);
		});
	},

	/*	Add the denied flag to the permission, the permission is not deleted and will appear in the list
		Access to this function must be verified before use !! */
	deny : function (id, callback) {
		db.collection('permission').update( { _id: mongo.helper.toObjectID(id)}, {'$set' : {status : 'denied'}}, function (err, result) {
			if(err) {
				callback(err);
				return;
			}
			console.log("Permission denied");
			callback(err, result);
		});
	},

	/*	List all permissions for an specific couple collection:id 
		return an object containing two arrays : requestor and target
		if the id is the target or the requestor of the permission, the result goes inside the corresponding array
	*/
	list : function (collection, id, callback) {
		var tasks, results = {};

		if(!id) {
			callback(new Error("You must provide an id"));
			return;
		}
		if(collection == "device") {
			tasks = { 
				requestor : {'from.collection' : collection, 'from.id' : id},
				target : {'to.collection' : collection, 'to.id' : id},
			};
		} else if(collection == "user") {
			tasks = {requestor : {'from.collection' : collection, 'from.id' : id} };
		} else if(collection == "permission") {
			tasks = {target: {'to.collection' : collection, 'to.id' : id} };
		} else {
			callback(new Error("You must provide a collection to the function ('device', 'user', 'permission')"));
			return;
		}

		async.forEachOf(tasks, function (task, key, cb) {
			db.collection('permission').find(task).toArray(function (err, result) {
				if(err) {
					console.log(err);
					cb(err);
					return;
				}
				results[key] = result;
				cb();
			});
		}, function done(err) {
			callback(err, results);
		});
	},

	/* from : { device : id || user : id }, to : { device : id || permission : id }, access : { key : "read/write"} */
	verify : function ( from, to, access, callback) {
		var request = {
			'from.collection' : from.device != undefined ? 'device' : 'user',
			'to.collection' : to.device != undefined ? 'device' : 'permission',
		};
		request['from.id'] = from[request['from.collection']];
		request['to.id'] = to[request['to.collection']];

		db.collection('permission').findOne(request, function (err, result) {
			if(err) {
				callback(err, false);
				return;
			}
			var keys = Object.keys(access);
			if( keys.length == 1 ) {
				// Get the permission for that key in the database results
				var auth = result.permissions[keys[0]];
				if(auth === "write" && (access[keys[0]] === "read" || access[keys[0]] === "write") ) {
					callback(err, true);
				} else if (auth === "read" && access[keys[0]] === "read" ) {
					callback(err, true);
				} else {
					callback(new Error("Unauthorized to access data"), false);
				}
			} else {
				callback(new Error("'access' parameter must contain ONE key like {key : 'read'} or {key : 'write'} "), false);
			}
		});
	}

	// TODO ??? ?
	isOwner : function (id, callback) {

	}
};

module.exports = app;