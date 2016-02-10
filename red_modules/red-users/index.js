var passwordHash = require('password-hash');
var mongo = require('mongoskin');
var async = require('async');
var util = require('util');

var db = mongo.db('mongodb://localhost/RED_DB');


/* 
var user = {
  _id: String,
  username: String,
  password: String,
  mail : String,
  token: {
  	value : String,
  	expireIn : Date
  }
  devices : [ String ],
}
*/

// Use of password-hash module, which add inside the password hash, the algorithm, the salt, the iteration

var app = {

	// User : { username , password (plaintext), mail }
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
		//New
		if( ! (user.token && typeof user.token == "string") ) {
			callback(new Error("You must provide a token in String format inside the first parameter"));
			return;
		}
		//
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

			user.hash = passwordHash.generate(user.password, {algorithm : 'sha256', saltLength : 10, iterations : 2});

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

	// Remove one specific user given it's ID
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

	// Get a list of all users
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

	// Find by ID
	find : function (id, callback ) {
		if( !( callback instanceof Function )) {
			throw new Error("You have to provide a function callback as last parameter");
		}
		if ( !(id && typeof id == "string") ) {
			callback(new Error("You must provide a mail as first parameter"));
			return;
		}
		findOne({ _id : mongo.helper.toObjectID(id) }, function (err, result) {
			if (err) {
		    	callback(err);
		    	return;
		    }
		    console.log("Find by ID");
		    callback(err, result);
		});
	},

	// Find by mail
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

	// User : { username or mail , password (plaintext) }
	// Callback( err, boolean)
	verify : function ( user, callback ) {
		if( !( callback instanceof Function )) {
			throw new Error("You have to provide a function callback as last parameter");
		}
		if( !(user && user instanceof Object) ) {
			callback( new Error("You must provide an user ( {username or mail, password(plain text) } ) as first parameter"), false);
			return;
		}
		if( !(typeof user.username == "string" || (typeof user.mail == "string" && validateEmail(user.mail) ) ) ) {
			callback( new Error("You must provide an username or mail inside the first argument"), false);
			return;
		}
		if( !(user.password && typeof user.password == "string") ) {
			callback( new Error("You must provide a password inside the first argument"), false);
			return;
		}

		findOne( { '$or' : [{username : user.username}, {mail : user.mail}] }, function (err, result) {
			if(err) {
				callback(err, false);
				return;
			}
			if( !result )  {
				callback(err, false);
				return;
			}
			if( passwordHash.verify(user.password, result.password)) {
				callback(err, true);
			} else {
				callback(err, false);
			}

		});
	},

	// Add a device to the set of devices of the user
	// Need to verify if the device exist before adding it
	addDevice : function ( device, user, callback ) {
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

	// Remove a device to the set of devices of the user
	// Need to verify if the device is in the list before
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

module.exports = app;