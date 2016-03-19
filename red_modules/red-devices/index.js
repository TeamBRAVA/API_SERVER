// To connect the database
var path = require('path');
var util = require('util');
var fs = require('fs');
var config = require('../red-config');
var jwt = require('jsonwebtoken');  //https://npmjs.org/package/node-jsonwebtoken
var mongo = require('mongoskin');
var db = mongo.db('mongodb://localhost/RED_DB');
/* 
Description: 

wiki: http://wiki.red.jankobox.fr
API documentation: http://api.red-cloud.io

Data structure: 

var device = {
  _id: String,
  owner: String,
  creationDate,
  token: String,
  certificate : {
    path : String,
    passphrase : String,
    fingerprint : String
  }
  installedversionRED: String,
  softwarelist: [String], 
  data: [ { datatype: String, value: String, date: Date() } ]    date is timestamp in milliseconds
}

var permissions = {
  _id: String,
  userid: String,
  permission: String
}
*/

/**
 * @fileOverview devices functions.
 * @author <a href="mailto:berthaud@edu.ece.fr">Thomas Berthaud</a>
 * @version 1.0.0
 */

/** @namespace */
var devices = {
    //////////////////////////DEVICE FUNCTIONS

    /**
     * callback that sends back the new device's id
     * @callback insertDeviceWithcertCallback
     * @param {string} err contains the error message if there was one
     * @param {string} result contains the id of the new Device created 
     */

    /** 
     * Insert a new Device with it's corresponding certificate
     * @param {string} path The path of the certificate
     * @param {string} passphrase The password of the certificate
     * @param {string} fingerprint The fingerprint of the certificate
     * @param {insertDeviceWithcertCallback} callback send back the result of the query
     */
    insertDeviceWithCert: function(path, passphrase, fingerprint, callback) {
        if (!(callback instanceof Function)) {
            throw new Error("You have to provide a function callback as last parameter");
        }
        if (!(path && typeof path === "string")) {
            callback(new Error("You must provide an id in obj"));
            return;
        }
        if (!(passphrase && typeof passphrase === "string")) {
            callback(new Error("You must provide an id in obj"));
            return;
        }
        if (!(fingerprint && typeof fingerprint === "string")) {
            callback(new Error("You must provide an id in obj"));
            return;
        }
        var device = {
            owner: null,
            creationDate: Date.now(),
            token: null,
            corrupted: false,
            certificate: {
                path: path,
                passphrase: passphrase,
                fingerprint: fingerprint
            },
            installedversionRED: null,
            softwarelist: [],
            data: []
        };
        db.collection('device').insert(device, function(err, result) {
            if (result.result.ok == 1) {
                callback(err, result.insertedIds[0]);
            } else {
                callback(new Error('Error while creating the device'), null);
            }
        });
    },

    /**
     * callback send back the number of rows affected by the query
     * @callback updateCallback
     * @param {string} err contains the error message if there was one
     * @param {object} result contains the number of rows affected by the update (to be modified)
     */


    /** 
     * Update Certificate Key
     * @param {object} obj the object containing the fields to update
     * @param {string} obj.id the device's id
     * @param {string} obj.certfkey the new certificate key
     * @param {updateCallback} callback send back the result of the query
     */
    certificateKey: function(obj, callback) {
        if (!(callback instanceof Function)) {
            throw new Error("You have to provide a function callback as last parameter");
        }
        if (!(obj.id && typeof obj.id === "string")) {
            callback(new Error("You must provide an id in obj"));
            return;
        }
        if (!(obj.certfkey && typeof obj.certfkey === "string")) {
            callback(new Error("You must provide a token in obj"));
            return;
        }
        db.collection('device').update({ _id: mongo.helper.toObjectID(obj.id) }, {'$set' : { 'certificate.passphrase': obj.certfkey }}, function (err, nbRow) {
            console.log('Certificate key is updated!');
            callback(err, nbRow);
        });
    },

    /** 
     * Update Certificate path
     * @param {object} obj the object containing the fields to update
     * @param {string} obj.id the device's id
     * @param {string} obj.path the new certificate path
     * @param {updateCallback} callback send back the result of the query
     */
    certificatePath: function(obj, callback) {
        if (!(callback instanceof Function)) {
            throw new Error("You have to provide a function callback as last parameter");
        }
        if (!(obj.id && typeof obj.id === "string")) {
            callback(new Error("You must provide an id in obj"));
            return;
        }
        if (!(obj.path && typeof obj.path === "string")) {
            callback(new Error("You must provide a token in obj"));
            return;
        }
        db.collection('device').update({ _id: mongo.helper.toObjectID(obj.id) }, {'$set' : { 'certificate.path': obj.path }}, function (err, nbRow) {
            console.log('Path to the Certificate is updated!');
            callback(err, nbRow);
        });
    },

    /** 
     * Push a new software into the chosen device
     * @param {object} obj the object containing the fields to update
     * @param {string} obj.id the device's id
     * @param {string} obj.newsoftware the new software id
     * @param {updateCallback} callback send back the result of the query
     */
    addNewSoftware: function(obj, callback) {
        if (!(callback instanceof Function)) {
            throw new Error("You have to provide a function callback as last parameter");
        }
        if (!(obj.id && typeof obj.id === "string")) {
            callback(new Error("You must provide an id in obj"));
            return;
        }
        if (!(obj.newsoftware && typeof obj.newsoftware === "string")) {
            callback(new Error("You must provide a token in obj"));
            return;
        }
        db.collection('device').update({ _id: mongo.helper.toObjectID(obj.id) }, { "$addToSet": { "softwarelist": obj.newsoftware } }, function(err, nbRow) {
            console.log('Softwarelist of device', obj.id, 'is updated!');
            callback(err, nbRow);
        });
    },


    /** 
     * Get the list of software for a device
     * @param {string} id The device's id
     * @param {updateCallback} callback send back the result of the query
     */
    softwares: function(id, callback) {
        if (!(callback instanceof Function)) {
            throw new Error("You have to provide a function callback as last parameter");
        }
        if (!(id && typeof id === "string")) {
            callback(new Error("You must provide an id"));
            return;
        }
        db.collection('device').findOne({ _id: mongo.helper.toObjectID(id) }, function(err, res) {
            console.log('Get the list of softwares');
            callback(err, res.softwarelist);
        });
    },

    /** 
     * Update the installed version of RED
     * @param {object} obj the object containing the fields to update
     * @param {string} obj.id the device's id
     * @param {string} obj.v the new version of RED software
     * @param {updateCallback} callback send back the result of the query
     */
    updateVersion: function(obj, callback) {
        if (!(callback instanceof Function)) {
            throw new Error("You have to provide a function callback as last parameter");
        }
        if (!(obj.id && typeof obj.id === "string")) {
            callback(new Error("You must provide an id in obj"));
            return;
        }
        if (!(obj.v && typeof obj.v === "string")) {
            callback(new Error("You must provide a token in obj"));
            return;
        }
        db.collection('device').update({ _id: mongo.helper.toObjectID(obj.id) }, {'$set': { installedversionRED: obj.v }}, function (err, nbRow) {
            console.log('Installed version of RED is updated for device ', obj.id);
            callback(err, nbRow);
        });
    },

    /** 
     * Push new data into the chosen device
     * @param {object} obj the object containing the fields to update
     * @param {string} obj.id the device's id
     * @param {string} obj.datatype the type of data
     * @param {string} obj.value the value to store
     * @param {updateCallback} callback send back the result of the query
     */
    pushData: function(obj, callback) {
        if (!(callback instanceof Function)) {
            throw new Error("You have to provide a function callback as last parameter");
        }
        if (!(obj.id && typeof obj.id === "string")) {
            callback(new Error("You must provide an id in obj"));
            return;
        }
        if (!(obj.datatype && typeof obj.datatype === "string")) {
            callback(new Error("You must provide a token in obj"));
            return;
        }
        if (!(obj.value && typeof obj.value === "string")) {
            callback(new Error("You must provide a token in obj"));
            return;
        }
        db.collection('device').findOne({ _id: mongo.helper.toObjectID(obj.id) }, function(err, res) {
            if (res != null) {
                var today = Date.now().toString(); //store the current date in a string
                db.collection('device').update({ _id: mongo.helper.toObjectID(obj.id) }, { '$push': { data: { datatype: obj.datatype, value: obj.value, date: today } } }, function(err, nbRow) {
                    console.log('New data are pushed into device ', obj.id);
                    callback(err, nbRow);
                });
            }
            else {
                callback(err, "The device does not exist.");
            }
        });
    },

    /**
     * callback send back an object containing the value asked
     * @callback pullCallback
     * @param {string} err contains the error message if there was one
     * @param {object} result contains the number of rows affected by the update
     * @param {string} result.value the value to be returned
     * @param {string} result.date the date on which the value has been saved
     */

    /** 
     * Get last entry of specified device according to the datatype given in parameter
     * @param {object} obj the object containing the fields to search for
     * @param {string} obj.id the device's id
     * @param {string} obj.datatype the type of data
     * @param {pullCallback} callback send back the result of the query
     */
    //possiblity of improvement with $filter (mongodb) but need version 3.2 of mongodb (current 3.0)
    pullDatatype: function(obj, callback) {
        if (!(callback instanceof Function)) {
            throw new Error("You have to provide a function callback as last parameter");
        }
        if (!(obj.id && typeof obj.id === "string")) {
            callback(new Error("You must provide an id in obj"));
            return;
        }
        if (!(obj.datatype && typeof obj.datatype === "string")) {
            callback(new Error("You must provide a token in obj"));
            return;
        }
        db.collection('device').findOne({ "_id": mongo.helper.toObjectID(obj.id), "data.datatype": obj.datatype }, function(err, result) {
            if (err) {
                callback(err);
            } else {
                var iToReturn = -1;
                if (result != null) {
                    var date, biggestDate = 0;
                    //return the last data corresponding to the datatype given in parameter
                    result.data.forEach(function(val, i, array) {
                        if (val.datatype == obj.datatype) {
                            date = parseInt(val.date);
                            if (date > biggestDate) {
                                biggestDate = date;
                                iToReturn = i;
                            }
                        }
                    })
                    
                    //if -1, there is no datatype at date asked
                    if (iToReturn != -1) {
                        //we retrieved the correct id, we can now build the object that will be sent back
                        var toReturn = {
                            value: result.data[iToReturn].value,
                            date: result.data[iToReturn].date
                        }

                        callback(err, toReturn);
                    } else {
                        callback(new Error("couple id and datatype not found"));
                    }
                } else callback(new Error("id or datatype not found"));
            }
        })
    },

    /** 
     * Get last entry of specified device according to the datatype and time given in parameter
     * @param {object} obj the object containing the fields to search for
     * @param {string} obj.id the device's id
     * @param {string} obj.datatype the type of data
     * @param {string} obj.date the time on which the data was saved
     * @param {pullCallback} callback send back the result of the query
     */
    pullDatatypeAndDate: function(obj, callback) {
        if (!(callback instanceof Function)) {
            throw new Error("You have to provide a function callback as last parameter");
        }
        if (!(obj.id && typeof obj.id === "string")) {
            callback(new Error("You must provide an id in obj"));
            return;
        }
        if (!(obj.datatype && typeof obj.datatype === "string")) {
            callback(new Error("You must provide a token in obj"));
            return;
        }
        if (!(obj.date && typeof obj.date === "string")) {
            callback(new Error("You must provide a token in obj"));
            return;
        }
        db.collection('device').findOne({ "_id": mongo.helper.toObjectID(obj.id), "data.datatype": obj.datatype, "data.date": obj.date }, function(err, result) {
            if (err) {
                callback(err);
            } else {
                var iToReturn = -1;
                //console.log(result);
                if (result != undefined || result != null) {
                    //return the last data corresponding to the datatype and the date given in parameter
                    result.data.forEach(function(val, i, array) {
                        if (val.datatype == obj.datatype && val.date == obj.date) {
                            iToReturn = i;
                        }
                    })
                    
                    //if -1, there is no datatype at date asked
                    if (iToReturn != -1) {
                        //we retrieved the correct id, we can now build the object that will be sent back
                        var toReturn = {
                            value: result.data[iToReturn].value,
                            date: result.data[iToReturn].date
                        }

                        callback(err, toReturn);
                    } else {
                        callback(new Error("couple id and datatype not found"));
                    }
                } else callback(new Error("id or datatype not found"));
            }

        });
    },

    ///////////////////////////////////////////////////TO DELETE////////////////////////////
    find: function(id, callback) {
        if (!(callback instanceof Function)) {
            throw new Error("You have to provide a function callback as last parameter");
        }
        if (!(id && typeof id === "string")) {
            callback(new Error("You must provide an id (string)"));
            return;
        }
        //retrieve only the device's id and its data
        db.collection('device').find({ _id: mongo.helper.toObjectID(id) }, { _id: 1, data: 1 }).toArray(function(err, result) {
            callback(err, result);
        });
    },

    /** 
     * Verify if the token is valid for the object.
     * If the token is not valid before the expiration date occur, the device might be corrupted
     * If it's the first connection, the database token will be null, and the bearerToken will be an empty string
     * @param {String} id The id representing the device (aka req.device.id)
     * @param {String} bearerToken The token for device authorization must be provided in the headers of the request
     * @param {pullCallback} callback send back the result of the query
     */
    validateToken: function(id, bearerToken, callback) {
        if (!(callback instanceof Function)) {
            throw new Error("You have to provide a function callback as last parameter");
        }
        if ( !(id && typeof id === "string") ) {
            callback(new Error("You must provide a token (String) as first parameter"));
            return;
        }
        if ( !(typeof bearerToken === "string") ) {
            callback(new Error("You must provide a token (String) as second parameter"));
            return;
        }
        
        db.collection('device').findOne({ "_id": mongo.helper.toObjectID(id)}, function (err, res) {
            if (res != null ) { 
                // Get the certificate to decipher the token
                var cert = fs.readFileSync(config.certsPath.publicKey); //public key

                // Check if the tokens match
                if( res.token == bearerToken ) {
                    jwt.verify( bearerToken, cert, {ignoreExpiration: config.token.ignoreExpiration }, function(err, decoded) { //Checking features of token (the expiration date)
                        if(err) { // outdated
                            console.log(err);
                            callback(new Error("Token Outdated"), false);
                        }
                        else{
                            // Not Outdated --> access granted
                            callback(err, true);
                        }
                    });
                } else {
                    if( res.token == null && bearerToken == "") {
                        callback(new Error("First connection"), false);
                    } else {
                        devices.corrupted(id, function (err) {
                            callback(new Error("Tokens mismatch, corrupted object"), false);
                        });
                    }
                }
            }
            else{
                callback(new Error("No device found"), false);
            }
        });
    },

    /** 
     * Declare an object as corrupted by setting it's flag in the database
     * @param {String} id The id representing the device (aka req.device.id)
     * @param {pullCallback} callback send back the errors of the query, null otherwise
    */
    corrupted : function(id, callback) {
        db.collection('device').update({_id : mongo.helper.toObjectID(id)}, {'$set': {corrupted : true}}, function (err, result) {
            if(err)
                console.log("Cannot declare object " + id + " as corrupted");
            callback(err);
        });
    },

    /** 
     * Declare an object as trusted by setting it's flag in the database
     * @param {String} id The id representing the device (aka req.device.id)
     * @param {pullCallback} callback send back the errors of the query, null otherwise
    */
    trusted : function(id, callback) {
        db.collection('device').update({_id : mongo.helper.toObjectID(id)}, {'$set':{corrupted : false}}, function (err, result) {
            if(err)
                console.log("Cannot declare object " + id + " as trusted");
            callback(err);
        });
    },

    /** 
     * Register a specific token for an 
     * @param {String} id The id representing the device (aka req.device.id)
     * @param {String} fingerprint the fingerprint of the object (aka req.ssl.fingerprint)
     * @param {pullCallback} callback send back the errors of the query and the issued token if it complete
    */
    register : function(id, fingerprint, callback) {
        var cert = fs.readFileSync(config.certsPath.privateKey);
        var token = jwt.sign({id : id, fingerprint: fingerprint}, cert, { algorithm: config.token.algorithm, expiresIn: config.token.expiresIn}); //expires in 10 minutes (value in seconds)

        db.collection('device').update({_id : mongo.helper.toObjectID(id)}, {'$set':{'token': token}}, function (err, result) {
            if(err) {
                console.log("Cannot register token for object " + id);
                callback(err);
            } else {
                callback(err, token);
            }
        });
    }

};

module.exports = devices;
