var mongo = require('mongoskin');
var async = require('async');
var path = require('path');
var util = require('util');
var fs = require('fs');

var config = require('../red-config');
var db = mongo.db('mongodb://localhost/RED_DB');


/* 
Description: 

wiki: http://wiki.red.jankobox.fr
API documentation: http://api.red-cloud.io

Data structure: 

var software = {
  _id: String,
  name : String,
  version : String,
  path : String,
  obsolete : Boolean
}
*/

/**
 * @fileOverview softwares functions.
 * @author <a href="mailto:jankowie@edu.ece.fr">Pierre Jankowiez</a>
 * @version 1.0.0
 */

/** @namespace */
var softwares = {

	/**
	 * Add a software to the list. Verify if the software is already uploaded
	 *	@param {Object} obj : { name, version, path } All are strings to define the software
	 *	@param {String} owner The id of the owner who push the software
	 *	@param {updateCallback} callback send back the errors of the query or nothing
	 */
	add : function(obj, owner, callback) {
		var soft = {
			name : obj.name,
			version : obj.version,
			path : obj.path,
			owner : owner,
			obsolete : false
		}
		// Find if a software has the same name in the list from the same owner
		db.collection('software').findOne({name : obj.name, owner : owner}, function (err, result){
			if(err) {
				console.log("Cannot find an existing software");
				callback(err);
				return;
			}
			// Set the new software in the database
			db.collection('software').insert(soft, function (err, res) {
				if(err) {
					error("Cannot register the new software", err, callback);
					return;
				}
				// Set the last software as obsolete if it exists
				if(result) {
					db.collection('software').update({_id : result._id}, {'$set' : {obsolete : true}}, function (err, res){
						if(err) {
							console.log("Cannot set obsolescence of the software");
							callback(err);
							return;
						}
					});
				}
				console.log("Software added successfully ! ");
				callback();
			});
		});
	},

	/**
	 * Remove a software in the database AND on the file system
	 *	@param {string} id The id of the software to delete
	 *	@param {updateCallback} callback send back the errors during the delete process or nothing
	 */
	remove : function(id, callback) {
		if(id && typeof id === 'string') {
			db.collection('software').findOne({_id : mongo.helper.toObjectID(id)}, function (err, res) {
				if(err) {
					error("Error while finding an existing software based on ID", err, callback);
					return;
				}
				if(res) {
					// Get the path of the file on the system
					var mPath = res.path;
					// Update the entry in the database so that there is no link to the file and it's set as obsolete anyway
					db.collection('software').update({_id : res._id}, { '$set' : {obsolete : true, path : null}}, function (err, res) {
						if(err) {
							error("Error while deleting the software", err, callback);
							return;
						}
						// Suppress the file
						fs.unlink(mPath, function (err) {
							if(err) {
								error("Error while deleting in the filesystem", err, callback);
								return;
							}
							callback();
						});
					});
				}
			});
		} else {
			callback(new Error("You need to set the ID as first parameter"));
			return;
		}
		// Obsolete : true
		// path : null
	},

	/** 
	 * Copy the software from the tmp filepath to the storage folder
	 * Use it in order to ensure no duplicated software files (or unattended erase)
	 * @param {string} tmp The temporary uploaded filepath
	 * @param {updateCallback} callback return an error if it cannot complete
	 */
	copy : function(tmp, callback) {
		var soft = path.basename(tmp);
		var ext = path.extname(tmp);

		var today = Date.now().toString();
		soft = soft.replace(ext, '') + '_' + today + ext;
		soft = path.join(__dirname, './storage', soft);

		fs.rename(tmp, soft, function (err) {
			if(err) {
				error("Cannot copy the software", err, callback);
				return;
			}
			callback(err, soft);
		});
	},

	/** 
	 * Find the last version of a software
	 * @param {string} id The id of the current obsolete software
	 * @param {updateCallback} callback return an error if it cannot complete
	 */
	lastOne : function(id, callback) {
		db.collection('software').findOne({_id : mongo.helper.toObjectID(id)}, function (err, res) {
			if(err) {
				return error("Cannot find a matching software in the database", err, callback);
			}
			if(res.obsolete == false) {
				return callback(err, {id : id});
			}
			db.collection('software').findOne({name : res.name, owner : res.owner, obsolete : false}, function (req, result) {
				if(err) {
					return error("Cannot find a matching software in the database", err, callback);
				}
				callback(err, {id : result._id.toString()});
			});
		});
	},


	/**
	 *	Create the list of new softwares IDs and useful infos to be updated
	 *	@param {Array} list List of softwares IDs installed on the device
	 *	@param {updateCallback} callback Return the list of last version of softwares [ {id, name, version} ]
	 */
	createList : function(list, callback) {
		var nList = [];
		async.each(list, function(soft, cb) {
			softwares.lastOne(soft, function (err, r) {
				if(r) {
					db.collection('software').findOne({_id : mongo.helper.toObjectID(r.id)}, function (err, res) {
						if(!err) {
							nList.push({id : res._id.toString(), name : res.name, version : res.version});
							cb();
						}
					});
				}
			});
		}, function done() {
			callback(nList);
		});
	},

	/**
	 *	Create the list of new softwares IDs to be updated
	 *	@param {Array} list List of softwares IDs installed on the device
	 *	@param {updateCallback} callback Return the list of last version of softwares [ {id, name, version} ]
	 */
	createIDList : function(list, callback) {
		var nList = [];
		async.each(list, function(soft, cb) {
			softwares.lastOne(soft, function (err, r) {
				if(r) {
					db.collection('software').findOne({_id : mongo.helper.toObjectID(r.id)}, function (err, res) {
						if(!err) {
							nList.push(res._id.toString());
							cb();
						}
					});
				}
			});
		}, function done() {
			callback(nList);
		});
	},

	/**
	 *	Return the path on the file system corresponding to the software ID
	 *	@param {string} id The ID of the software in the database
	 *	@param {updateCallback} callback Return the path
	 */
	getPath : function(id, callback) {
		db.collection('software').findOne({_id : mongo.helper.toObjectID(id)}, function (err, res) {
			if(err) {
				return error("Cannot get the path", err, callback);
			}
			callback(err, res.path);
		});
	}
}


module.exports = softwares;

function error (message, err, callback) {
	console.log(message)
	callback(err);
}