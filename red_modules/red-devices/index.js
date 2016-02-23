// To connect the database
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
  expirationdate: String,
  certificate : {
    path : String,
    passphrase : String,
    fingerprint : String
  }
  installedversionRED: String,
  softwarelist: [String], 
  data: [ { datatype: String, value: String, date: Date.now } ]
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
    insertDeviceWithCert: function (path, passphrase, fingerprint, callback) {
        var device = {
            owner: null,
            creationDate: Date.now(),
            token: null,
            expirationdate: null,
            certificate: {
                path: path,
                passphrase: passphrase,
                fingerprint: fingerprint
            },
            installedversionRED: null,
            softwarelist: [],
            data: []
        };
        db.collection('device').insert(device, function (err, result) {
            if (result.result.ok == 1) {
                callback(err, result.insertedIds[0]);
            } else {
                callback(new Error('Error while creating the device'), null);
            }
        });
    },

    // Insert a new device  
    // ### DON'T USE THIS METHOD ! ###
    insertDevice: function (callback) {
        db.collection('device').insert({}, function (err, result) {
            if (result.result.ok == 1) {
                callback(err, result.insertedIds[0]);
            } else callback("error creating device");
        });
    },
    
    /**
     * callback send back the number of rows affected by the query
     * @callback updateCallback
     * @param {string} err contains the error message if there was one
     * @param {object} result contains the number of rows affected by the update (to be modified)
     */

    /** 
     * Update Token and Expiration Date
     * @param {object} obj the object containing the fields to update
     * @param {string} obj._id the device's id
     * @param {string} obj.token the new token to update
     * @param {string} obj.expDate the token's expiration date
     * @param {updateCallback} callback send back the result of the query
     */
    updateToken: function (obj, callback) {
        db.collection('device').update({ _id: mongo.helper.toObjectID(obj._id) }, { token: obj.token, expirationdate: obj.expDate }, function (err, nbRow) {
            console.log('Token is updated!');
            callback(err, nbRow);
        });
    },

    /** 
     * Update Certificate Key
     * @param {object} obj the object containing the fields to update
     * @param {string} obj._id the device's id
     * @param {string} obj.certfkey the new certificate key
     * @param {updateCallback} callback send back the result of the query
     */
    certificateKey: function (obj, callback) {
        db.collection('device').update({ _id: mongo.helper.toObjectID(obj._id) }, { certificatekey: obj.certfkey }, function (err, nbRow) {
            console.log('Certificate key is updated!');
            callback(err, nbRow);
        });
    },

    /** 
     * Update Certificate path
     * @param {object} obj the object containing the fields to update
     * @param {string} obj._id the device's id
     * @param {string} obj.path the new certificate path
     * @param {updateCallback} callback send back the result of the query
     */
    certificatePath: function (obj, callback) {
        db.collection('device').update({ _id: mongo.helper.toObjectID(obj._id) }, { pathtocertificate: obj.path }, function (err, nbRow) {
            console.log('Path to the Certificate is updated!');
            callback(err, nbRow);
        });
    },

    /** 
     * Push a new software into the chosen device
     * @param {object} obj the object containing the fields to update
     * @param {string} obj._id the device's id
     * @param {string} obj.newsoftware the new software
     * @param {updateCallback} callback send back the result of the query
     */
    addNewSoftware: function (obj, callback) {
        db.collection('device').update({ _id: mongo.helper.toObjectID(obj._id) }, { "$addToSet": { "softwarelist": obj.newsoftware } }, function (err, nbRow) {
            console.log('Softwarelist of device', obj._id, 'is updated!');
            callback(err, nbRow);
        });
    },

    /** 
     * Update the installed version of RED
     * @param {object} obj the object containing the fields to update
     * @param {string} obj._id the device's id
     * @param {string} obj.v the new version of RED software
     * @param {updateCallback} callback send back the result of the query
     */
    updateVersion: function (obj, callback) {
        db.collection('device').update({ _id: mongo.helper.toObjectID(obj._id) }, { installedversionRED: obj.v }, function (err, nbRow) {
            console.log('Installed version of RED is updated for device ', obj._id);
            callback(err, nbRow);
        });
    },
    
    /** 
     * Push new data into the chosen device
     * @param {object} obj the object containing the fields to update
     * @param {string} obj._id the device's id
     * @param {string} obj.datatype the type of data
     * @param {string} obj.value the value to store
     * @param {updateCallback} callback send back the result of the query
     */
    pushData: function (obj, callback) {
        db.collection('device').findOne({ _id: mongo.helper.toObjectID(obj._id) }, function (err, res) {
            if (res != undefined) {
                var today = Date.now().toString(); //store the current date in a string
                db.collection('device').update({ _id: mongo.helper.toObjectID(obj._id) }, { '$push': { data: { datatype: obj.datatype, value: obj.value, date: today } } }, function (err, nbRow) {
                    console.log('New data are pushed into device ', obj._id);
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
     * @param {string} obj._id the device's id
     * @param {string} obj.datatype the type of data
     * @param {pullCallback} callback send back the result of the query
     */
    //possiblity of improvement with $filter (mongodb) but need version 3.2 of mongodb (current 3.0)
    pullDatatype: function (obj, callback) {
        db.collection('device').findOne({ "_id": mongo.helper.toObjectID(obj._id), "data.datatype": obj.datatype }, function (err, result) {
            if (err) console.log(err);
            var iToReturn;
            if (result != undefined) {
                var date, biggestDate = 0;
                //return the last data corresponding to the datatype given in parameter
                result.data.forEach(function (val, i, array) {
                    if (val.datatype == obj.datatype) {
                        date = parseInt(val.date);
                        if (date > biggestDate) {
                            biggestDate = date;
                            iToReturn = i;
                        }
                    }
                })
                
                //we retrieved the correct id, we can now build the object that will be sent back
                var toReturn = {
                    value: result.data[iToReturn].value,
                    date: result.data[iToReturn].date
                }
            } else toReturn = result;

            callback(err, toReturn);
        })
    },

    /** 
     * Get last entry of specified device according to the datatype and time given in parameter
     * @param {object} obj the object containing the fields to search for
     * @param {string} obj._id the device's id
     * @param {string} obj.datatype the type of data
     * @param {string} obj.date the time on which the data was saved
     * @param {pullCallback} callback send back the result of the query
     */
    pullDatatypeAndDate: function (obj, callback) {
        db.collection('device').findOne({ "_id": mongo.helper.toObjectID(obj._id), "data.datatype": obj.datatype, "data.date": obj.date }, function (err, result) {
            if (err) console.log(err);
            
            var iToReturn;
            if (result != undefined) {
                //return the last data corresponding to the datatype and the date given in parameter
                result.data.forEach(function (val, i, array) {
                    if (val.datatype == obj.datatype && val.date == obj.date) {
                        iToReturn = i;
                    }
                })
                
                //we retrieved the correct id, we can now build the object that will be sent back
                var toReturn = {
                    value: result.data[iToReturn].value,
                    date: result.data[iToReturn].date
                }
            } else toReturn = result;

            callback(err, toReturn);
        });
    },

    ///////////////////////////////////////////////////TO DELETE////////////////////////////
    find: function (id, callback) {
        db.collection('device').find({ _id: mongo.helper.toObjectID(id) }).toArray(function (err, result) {
            callback(err, result);
        });
    }

}
module.exports = devices;
