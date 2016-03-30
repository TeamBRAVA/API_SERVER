var mongo = require('mongoskin');
var async = require('async');
var util = require('util');


var db = mongo.db('mongodb://localhost/RED_DB');

/**
 * @property {object}  defaults               - The default values for parties.
 * @property {number}  defaults.players       - The default number of players.
 * @property {string}  defaults.level         - The default level for the party.
 * @property {object}  defaults.treasure      - The default treasure.
 * @property {number}  defaults.treasure.gold - How much gold the party starts with.
 */
var permission;

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

/**
 * @fileOverview Permissions functions.
 * @author {@link mailto:meetbrava@gmail.com|Team Brava}
 * @see {@link https://github.com/TeamBRAVA/API_SERVER|Github}
 * @version 1.0.0
 */

/* All callback are in the form  : callback(err, result); */
/**@namespace */
var _permissions = {

    /** 
     * Insert a new permission in the database
     * @param {object} obj The object representing the permission (required)
     * @param {string} obj.from The collection type which ask the permission ("device" or "user")
     * @param {string} obj.to The collection type which is the target of the permission ("device" or "permission")
     * @param {object} obj.permission The object representing what kind of entry the requestor can access (ie {"key" : "read|write" , ... } )
     * @param {function} callback Callback function which is called when this function end. Pass errors and the result of the insert
     */
    insert: function (obj, callback) {

        if (!(obj.from[0] == "device" || obj.from[0] == "user")) {
            callback(new Error("Insert first argument must contain a 'from' field equals to 'device' or 'user'"));
            return;
        }
        if (!(obj.to[0] == "permission" || obj.to[0] == "device")) {
            callback(new Error("Insert first argument must contain a 'to' field equals to 'device', 'user' or 'permission'"));
            return;
        }
        if (obj.to[0] == "device") {
            if (!(obj.permissions && obj.permissions instanceof Object && Object.keys(obj.permissions).length > 0)) {
                callback(new Error("Insert first argument must contain a 'permissions' array containing all the accessible key to data"));
                return;
            }
        }

        var permission = {
            from: {
                collection: obj.from[0],
                id: obj.from[1]
            },
            to: {
                collection: obj.to[0],
                id: obj.to[1]
            },
            permissions: (obj.to[0] == "permission" ? null : obj.permissions),
            status: "pending"
        };

        db.collection('permission').insert(permission, function (err, result) {
            if (err) {
                callback(err);
                return;
            }
            console.log("Permission inserted");
            callback(err, result);
        });

    },

	/** 
     * Remove a permission in the database
     * @param {string} id The id representing the permission entry in the database
     * @param {function} callback Callback function which is called when this function end. Pass errors and result
     */
	remove : function (id, callback) {
		if( !( callback instanceof Function )) {
			throw new Error("You have to provide a function callback as last parameter");
		}
		if ( !(id && typeof id == "string") ) {
			callback(new Error("You must provide an ID as first parameter"));
			return;
		}
		db.collection('permission').remove( { _id: mongo.helper.toObjectID(id) }, function (err, result) {
		    if (err) {
		    	callback(err);
		    	return;
		    }
		    console.log("Permission removed");
		    callback(err, result);
		});
	},


	/** 
     * Add the granted flag to the permission. use this function when the user allow a permission
     * @param {string} id The id representing the permission entry in the database
     * @param {function} callback Callback function which is called when this function end. Pass errors and result
     */
	allow : function (id, callback) {
		if( !( callback instanceof Function )) {
			throw new Error("You have to provide a function callback as last parameter");
		}
		if ( !(id && typeof id == "string") ) {
			callback(new Error("You must provide an ID as first parameter"));
			return;
		}
		db.collection('permission').update( { _id: mongo.helper.toObjectID(id) }, {'$set' : {status : 'granted'}}, function (err, result) {
			if(err) {
				callback(err);
				return;
			}
			console.log("Permission granted");
			callback(err, result);
		});
	},

	/** 
     * Add the denied flag to the permission. use this function when the user deny a permission
     * @param {string} id The id representing the permission entry in the database
     * @param {function} callback Callback function which is called when this function end. Pass errors and result
     */
	deny : function (id, callback) {
		if( !( callback instanceof Function )) {
			throw new Error("You have to provide a function callback as last parameter");
		}
		if ( !(id && typeof id == "string") ) {
			callback(new Error("You must provide an ID as first parameter"));
			return;
		}
		db.collection('permission').update( { _id: mongo.helper.toObjectID(id)}, {'$set' : {status : 'denied'}}, function (err, result) {
			if(err) {
				callback(err);
				return;
			}
			console.log("Permission denied");
			callback(err, result);
		});
	},

	/** 
     * List all permissions given a couple collection and id. Return the entry when the couple is the target or the requestor of the permission
     * @param {string} collection The collection type (ie "device", "user", "permission") to find in the database
     * @param {string} id The id representing the entry in the collection given above
     * @param {function} callback Callback function which is called when this function end. Pass errors and result. Return two arrays : requestor and target depending on the couple state
     */
    list: function (collection, id, callback) {
        var tasks, results = {};

        if (!id) {
            callback(new Error("You must provide an id"));
            return;
        }
        if (collection == "device") {
            tasks = {
                requestor: { 'from.collection': collection, 'from.id': id },
                target: { 'to.collection': collection, 'to.id': id },
            };
        } else if (collection == "user") {
            tasks = { requestor: { 'from.collection': collection, 'from.id': id } };
        } else if (collection == "permission") {
            tasks = { target: { 'to.collection': collection, 'to.id': id } };
        } else {
            callback(new Error("You must provide a collection to the function ('device', 'user', 'permission')"));
            return;
        }


        async.forEachOf(tasks, function (task, key, cb) {
            db.collection('permission').find(task).toArray(function (err, result) {
                if (err) {
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

    /** 
     * Verify if a current operation is possible given two couple object
     * @param {object} from The object representing the requestor of the permission
     * @param {string} from.device The device id of the requestor (optional)
     * @param {string} from.user The user id of the requestor (optional)
     * @param {object} to The object representing the target of the permission
     * @param {string} to.device The device id as a target  (optional)
     * @param {string} to.permission The permission id as a target (optional)
     * @param {string} access The access type to the data ("read" or "write")
     * @param {function} callback Callback function which is called when this function end. Pass errors and result (true or false)
     */
    verify: function (from, to, access, callback) {

        // Parse the arguments
        if (Object.keys(from).length != 1 && Object.keys(to).length != 1) {
            callback(new Error("Arguments 'from' and 'to' must contain only one parameter"), false);
            return;
        }
        var request = {
            'from.collection': from.device != undefined ? 'device' : 'user',
            'to.collection': to.device != undefined ? 'device' : 'permission',
            'status': 'granted'
        };
        request['from.id'] = from[request['from.collection']];
        request['to.id'] = to[request['to.collection']];

        //console.log(request);

        this.checkRules(from, to, function (err, res) {
            //console.log("checkRules : " + res);
            if (err) { console.log(err); }
            if (res === true) {	// The rules have more priority than other permissions
                callback(err, true);
                return;
            }
            // NOT FINDONE BUT FIND ALL !!!!!!!!!!
            db.collection('permission').findOne(request, function (err, result) {
                if (err || !result) {
                    callback(err, false);
                    return;
                }
                var keys = Object.keys(access);
                if (keys.length == 1) {
                    // Get the permission for that key in the database results
                    var auth = result.permissions[keys[0]];
                    if (auth === "write" && (access[keys[0]] === "read" ||  access[keys[0]] === "write")) {
                        callback(err, true);
                    } else if (auth === "read" && access[keys[0]] === "read") {
                        callback(err, true);
                    } else {
                        callback(new Error("Unauthorized to access data"), false);
                    }
                } else {
                    callback(new Error("'access' parameter must contain ONE key like {key : 'read'} or {key : 'write'} "), false);
                }
            });
        });
    },

	/** 
     * Check some default rules to manage devices and user permissions (rules are hard coded like device owner has all access)
     * @param {object} from The object representing the requestor of the permission
     * @param {string} from.device The device id of the requestor (optional)
     * @param {string} from.user The user id of the requestor (optional)
     * @param {object} to The object representing the target of the permission
     * @param {string} to.device The device id as a target  (optional)
     * @param {string} to.permission The permission id as a target (optional)
     * @param {function} callback Callback function which is called when this function end. Pass errors and result (true or false)
     */
	checkRules : function (from, to, callback) {
		// Parse the arguments
		if(Object.keys(from).length != 1 && Object.keys(to).length != 1) {
			callback(new Error("Arguments 'from' and 'to' must contain only one parameter"), false);
			return;
		}
		if ( !(Object.keys(from)[0] && typeof Object.keys(from)[0] == "string") ) {
			callback(new Error("You must provide an collection name as key"));
			return;
		}
		if ( !(Object.keys(to)[0] && typeof Object.keys(to)[0] == "string") ) {
			callback(new Error("You must provide an collection name as second key"));
			return;
		}
		if ( !(from[Object.keys(from)[0]] && typeof from[Object.keys(from)[0]] == "string") ) {
			callback(new Error("You must provide an ID as first parameter"));
			return;
		}
		if ( !(to[Object.keys(to)[0]] && typeof to[Object.keys(to)[0]] == "string") ) {
			callback(new Error("You must provide an ID as second parameter"));
			return;
		}
		from.collection = Object.keys(from)[0];
		to.collection = Object.keys(to)[0];
		from.id = from[from.collection];
		to.id = to[to.collection];

        // if the requestor is the target
        if (to.collection === from.collection && to.id === from.id) {
            if (to.collection === "device") {	// If it's a device
                callback(null, true);
            } else if (to.collection === "user") { // If it's a user
                callback(null, true);
            }
        } else if (to.collection === "device" && from.collection === "user") {
            // Find if the device is owned by the user
            db.collection('user').count({ _id: mongo.helper.toObjectID(from.id), devices: to.id }, function (err, count) {
                if (err || count == 0) {
                    callback(err, false);
                    return;
                }
                callback(err, true);
            });
        } else if (to.collection === "user" && from.collection === "device") {
            // Find if the user has the devices in its set
            db.collection('user').count({ _id: mongo.helper.toObjectID(to.id), devices: from.id }, function (err, count) {
                if (err || count == 0) {
                    callback(err, false);
                    return;
                }
                callback(err, true);
            });
        } else {
            callback(null, false);
        }
    },

    
    pullUserPermission: function (condition, callback) {
        // we get the data for the permission
        // we retrieve the data fromt the user
        if (!(callback instanceof Function)) {
            throw new Error("You have to provide a function callback as last parameter");
        }
        if (!(condition && typeof condition == "string")) {
            callback(new Error("You must provide an ID as first parameter"));
            return;
        }
        db.collection('permission').find({ _id: condition }, function (err, result) {
            if (err) {
                callback(err);
                return;
            }
            console.log("permission returned");
            callback(err, result);
        });
    }
};

module.exports = _permissions;