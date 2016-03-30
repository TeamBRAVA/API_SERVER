var passwordHash = require('password-hash');
var mongo = require('mongoskin');
var async = require('async');
var util = require('util');
var path = require('path');
var config = require('../red-config');
var db = mongo.db('mongodb://localhost/RED_DB');
var express = require('express');
var jwt = require('jsonwebtoken');  //https://npmjs.org/package/node-jsonwebtoken
var expressJwt = require('express-jwt'); //https://npmjs.org/package/express-jwt
var fs = require('fs');

/**
 * @property {object}  defaults               - The default values for parties.
 * @property {number}  defaults.players       - The default number of players.
 * @property {string}  defaults.level         - The default level for the party.
 * @property {object}  defaults.treasure      - The default treasure.
 * @property {number}  defaults.treasure.gold - How much gold the party starts with.
 */
var user;


/**
 * @fileOverview Users functions.
 * @author {@link mailto:meetbrava@gmail.com|Team Brava}
 * @see {@link https://github.com/TeamBRAVA/API_SERVER|Github}
 * @version 1.0.0
 */

/**@namespace */
var _users = {

	/** 
     * insert a new user in the database
     * @param {object} user The object containing all the required user informations see above
     * @param {string} user.username The username of the user
     * @param {string} user.password The password of the user as clear text
     * @param {string} user.token The token of the user, automatically creating at registering time
     * @param {string} user.mail The mail of the user for contact or second method for registration
     * @param {Function} callback Callback when this function end. Pass err and result
     */
	insert : function ( user, callback) {
		if( !( callback instanceof Function )) {
			throw new Error("You have to provide a function callback as last parameter");
		}
		if( ! (user.username && typeof user.username =='string') ) {
			callback(new Error("You must provide a username in a String format inside the first parameter"));
			return;
		}
		if( ! (user.password && typeof user.password == "string") ) {
			callback(new Error("You must provide a password in String format inside the first parameter"));
			return;
		}
		if( ! (user.token && typeof user.token == "string") ) {
			callback(new Error("You must provide a token in String format inside the first parameter"));
			return;
		}
		if( !( user.mail && typeof user.mail == "string" && validateEmail(user.mail) ) ) {
			callback(new Error("You must provide a valid mail"));
			return;
		}

		// Check in the database if the username doesn't exist
		db.collection('user').count( { '$or' : [{username : user.username}, {mail : user.mail}] }, function (err, count) {
			if( err ) {
				callback(err);
				return;
			}
			if( count != 0 ) {
				callback( new Error("User already exist") );
				return;
			}

			user.hash = passwordHash.generate(user.password, {algorithm : config.hash.algorithm, saltLength : config.hash.saltLength, iterations : config.hash.iterations});

			var mUser = {
				username : user.username,
				password : user.hash,
				mail : user.mail,
				token : {
					value : user.token,
					expireIn : user.expireIn
				},
				devices : []
			}

			db.collection('user').insert(mUser, function ( err, result ) {
				if ( err ) {
					callback(err);
					return;
				}
				console.log('User inserted');
				callback(err, result);
			});
		});
	},

	/** 
     * delete a user in the database
     * @param {string} id The id of the user to delete
     * @param {Function} callback Callback when this function end. Pass err and result
     */
	remove : function ( id, callback) {
		if( !( callback instanceof Function )) {
			throw new Error("You have to provide a function callback as last parameter");
		}
		db.collection('user').remove( { _id: mongo.helper.toObjectID(id) }, function (err, result) {
		    if (err) {
		    	callback(err);
		    	return;
		    }
		    console.log("User removed");
		    callback(err, result);
		});
	},

	/** 
     * list all users in the database
     * @param {Function} callback Callback when this function end. Pass err and result
     */
	list : function ( callback ) {
		if( !( callback instanceof Function )) {
			throw new Error("You have to provide a function callback as last parameter");
		}
		db.collection('user').find().toArray( function (err, result) {
			if (err) {
		    	callback(err);
		    	return;
		    }
		    console.log("Users listed");
		    callback(err, result);
		});
	},

	/** 
     * find a user in the database given it's ID
     * @param {string} id The id of the user to find
     * @param {Function} callback Callback when this function end. Pass err and result
     */
	find : function (id, callback ) {
		if( !( callback instanceof Function )) {
			throw new Error("You have to provide a function callback as last parameter");
		}
		if ( !(id && typeof id == "string") ) {
			callback(new Error("You must provide an id (string) as first parameter"));
			return;
		}
		findOne({ _id : mongo.helper.toObjectID(id) }, function (err, result) {
			if (err) {
		    	callback(err);
		    	return;
		    }
		    console.log("Find By ID");
		    callback(err, result);
		});
	},

	/** 
     * Create a summary of the user, return only _id, username and mail
     * @param {string} id The id of the user to find
     * @param {Function} callback Callback when this function end. Pass err and result
     */
	findSummary : function (id, callback ) {
		if( !( callback instanceof Function )) {
			throw new Error("You have to provide a function callback as last parameter");
		}
		if ( !(id && typeof id == "string") ) {
			callback(new Error("You must provide an id (string) as first parameter"));
			return;
		}
		db.collection('user').findOne({ _id : mongo.helper.toObjectID(id) }, {username:1, mail:1}, function (err, result) {
			if (err) {
		    	callback(err);
		    	return;
		    }
		    callback(err, result);
		});
	},
	

	/** 
     * Find a user given it's token. Use for authentication
     * @param {string} token The token of the user
     * @param {Function} callback Callback when this function end. Pass err and result
     */
	findByToken : function(token,callback){
		if( !( callback instanceof Function )) {
			throw new Error("You have to provide a function callback as last parameter");
		}
		findOne({ token : token }, function (err, result) {
			if (err) {
				callback(err);
			}
			console.log("Find by Token");
			callback(err, result._id);
		});
	},
	
	/** 
     * Find a user by mail
     * @param {string} mail The mail of the user
     * @param {Function} callback Callback when this function end. Pass err and result
     */
	findMail : function ( mail, callback ) {
		if( !( callback instanceof Function )) {
			throw new Error("You have to provide a function callback as last parameter");
		}
		if ( !(mail && typeof mail == "string" && validateEmail(mail) ) ) {
			callback(new Error("You must provide a mail as first parameter"));
			return;
		}
		findOne({ mail : mail }, function (err, result) {
			if (err) {
		    	callback(err);
		    	return;
		    }
		    console.log("Find by mail");
		    callback(err, result);
		});
	},
    

    /** 
     * Find a user by its username
     * @param {string} username The user username
     * @param {Function} callback Callback when this function end. Pass err and result
     */
	findUsername : function ( username, callback ) {
		if( !( callback instanceof Function )) {
			throw new Error("You have to provide a function callback as last parameter");
		}
		if ( !(username && typeof username == "string") ) {
			callback(new Error("You must provide a username as first parameter"));
			return;
		}
		findOne({ username : username }, function (err, result) {
			if (err) {
		    	callback(err);
		    	return;
		    }
		    console.log("Find by username");
		    callback(err, result);
		});
	},
    

    /** 
     * List all users that owns a specific device
     * @param {string} device The id of the device
     * @param {Function} callback Callback when this function end. Pass err and result
     */
	own : function ( device, callback ) {
		if( !( callback instanceof Function )) {
			throw new Error("You have to provide a function callback as last parameter");
		}
		if ( !(device && typeof device == "string") ) {
			callback(new Error("You must provide an ID (String) as first parameter"));
			return;
		}
		find({ devices : device }, function (err, result) {
			if (err) {
		    	callback(err);
		    	return;
		    }
		    console.log("owner of devices");
		    callback(err, result);
		});
	},

	
	/** 
     * Check if the token is correct (true if correct, false otherwise)
     * @param {string} bearerToken The token given in the Authorization header during request
     * @param {Function} callback Callback when this function end. Pass err and true or false
     */
	validateToken : function ( bearerToken, callback ) {
		if( !( callback instanceof Function )) {
			throw new Error("You have to provide a function callback as last parameter");
		}
		if ( !(bearerToken && typeof bearerToken == "string") ) {
			callback(new Error("You must provide a token (String) as first parameter"));
			return;
		}
		else{
			findOne({ token: bearerToken }, function (err, res) {
    			if (res != null ){ 
					//Getting the certificate
				    var cert = fs.readFileSync(config.certsPath.publicKey); //public key
				    jwt.verify( bearerToken, cert, {ignoreExpiration: config.token.ignoreExpiration }, function(err, decoded) { //Checking features of token (the expiration date)
						if(err) { 
                            console.log(err);
					        callback(new Error("outdatedtoken"), false);
					    }
					    else{
					    	callback(err, true);
					    }
    				});
    			}	
    			else{
    				callback(new Error("tokenunmatcherror"), false);
    			}
    		});
		}
	},
    
    /** 
     * Verify if the user couple username:password match a user in the database
     * @param {object} user The object representing the user (required)
     * @param {string} user.username The username of the user
     * @param {string} user.password The username password in clear text (as received in the request)
     * @param {Function} callback Callback when this function end. Pass err and true or false
     */
	verifyAndLogin : function ( user, callback ) {
		if( !(callback instanceof Function) ) {
			throw new Error("You have to provide a function callback as last parameter");
		}
		if( !(user && user instanceof Object) ) {
			callback( new Error("You must provide an user ( {username, password(plain text) } ) as first parameter"), false);
			return;
		}
		if( !(typeof user.username == "string" ) ) {
			callback( new Error("You must provide an username inside the first argument"), false);
			return;
		}
		if( !(user.password && typeof user.password == "string") ) {
			callback( new Error("You must provide a password inside the first argument"), false);
			return;
		}
		
		//CHECK USERNAME/MAIL AND PASS IF THEY MATCH OR NOT
		findOne({username : user.username}, function (err, result) {
			if(err) {
				callback(err, false);
			}
			if( !result )  {
				callback(err, false);
			}
			if( passwordHash.verify(user.password, result.password)) {
				//generate new token
                var cert = fs.readFileSync(config.certsPath.privateKey); //private key
				var newToken = jwt.sign(user, cert, { algorithm: config.token.algorithm, expiresIn: config.token.expiresIn}); //expire value in seconds
                
                //store the newly generated token in mongo
                db.collection('user').update({username : user.username}, {'$set':{'token': newToken}}, function (err, result) {
                    if(err){
                        callback(new Error("tokensavingerror"),false);
                    }else{
                        callback(err,newToken);
                    }
                })
				
   			}
			else{
				callback(new Error("passworderror"), false);
			}
		});
	},

	/** 
     * Verify if the user couple id:password match a user in the database
     * @param {object} user The object representing the user (required)
     * @param {string} user.id The user id
     * @param {string} user.password The username password in clear text (as received in the request)
     * @param {Function} callback Callback when this function end. Pass err and true or false
     */
	verifyByID : function ( user, callback ) {
		if( !(callback instanceof Function) ) {
			throw new Error("You have to provide a function callback as last parameter");
		}
		if( !(user && user instanceof Object) ) {
			callback( new Error("You must provide an user ( {id, password(plain text) } ) as first parameter"), false);
			return;
		}
		if( !(user.id && typeof user.id == "string" ) ) {
			callback( new Error("You must provide an id inside the first argument"), false);
			return;
		}
		if( !(user.password && typeof user.password == "string") ) {
			callback( new Error("You must provide a password inside the first argument"), false);
			return;
		}
		
		findOne({_id : mongo.helper.toObjectID(user.id)}, function (err, result) {
			if(err) {
				callback(err, false);
			}
			if( !result )  {
				callback(err, false);
			}
			if( passwordHash.verify(user.password, result.password)) {
				
				callback(undefined, true);
				
   			}
			else{
				callback(new Error("password mismatch"), false);
			}
		});
	},

	/*
	 * Find all users ID that have the device in their set
	 * @param {string} device The device ID
	 * @param {Function} callback Function callback when this function end. Pass err and result
	 */
	findDeviceUsers : function ( device, callback ) {
		if( !( callback instanceof Function )) {
			throw new Error("You have to provide a function callback as last parameter");
		}
		if( !(device && typeof device == "string") ) {
			callback( new Error("You must provide a device ID as first argument"));
			return;
		}
		db.collection('user').find({devices : device}, {_id:1}).toArray(function (err, results) {
			if(err) callback(err);
			else callback(err, results);
			console.log(results);
		});
	},

	/*
	 * Add a device to the set of devices of the user
	 * @param {string} device The device ID to register
	 * @param {string} user The user ID in which to bind the device ID
	 * @param {Function} callback Callback when this function end. Pass err and result
	 */
	addDevice : function ( device, user, callback ) {
		if( !( callback instanceof Function )) {
			throw new Error("You have to provide a function callback as last parameter");
		}
		if( !(device && typeof device == "string") ) {
			callback( new Error("You must provide a device ID as first argument"));
			return;
		}
		if( !(user && typeof user == "string") ) {
			callback( new Error("You must provide a user ID as second argument"));
			return;
		}
		db.collection('user').update({_id : mongo.helper.toObjectID(user) }, {'$push': { devices: device } }, function (err, result) {
			if(err) {
				callback(err);
				return;
			}
			if(!result) {
				callback(new Error("No update done"));
				return;
			}
			callback(err, result);
		});
	},

	/*
	 * Remove a device to the set of devices of the user
	 * @param {string} device The device ID to remove
	 * @param {string} user The user ID in which to unbind the device ID
	 * @param {Function} callback Callback when this function end. Pass err and result
	 */
	removeDevice : function ( device, user, callback ) {
		if( !( callback instanceof Function )) {
			throw new Error("You have to provide a function callback as last parameter");
		}
		if( !(device && typeof device == "string") ) {
			callback( new Error("You must provide a device ID as first argument"));
			return;
		}
		if( !(user && typeof user == "string") ) {
			callback( new Error("You must provide a user UD as second argument"));
			return;
		}
		db.collection('user').update({_id : mongo.helper.toObjectID(user) }, {'$pull': { devices: device } }, function (err, result) {
			if(err) {
				callback(err);
				return;
			}
			if(!result) {
				callback(new Error("No update done"));
				return;
			}
			callback(err, result);
		});
	}
}


function find ( condition, callback ) {
	db.collection('user').find(condition).toArray( callback );
}

function findOne ( condition, callback ) {
	db.collection('user').findOne(condition, callback ) ;
}

function isFunction(functionToCheck) {
 var getType = {};
 return functionToCheck && getType.toString.call(functionToCheck) === '[object Function]';
}

// StackOverflow
function validateEmail(email) {
    var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
}

module.exports = _users;