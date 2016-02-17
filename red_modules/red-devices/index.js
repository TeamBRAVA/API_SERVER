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

var app = {
    //////////////////////////DEVICE FUNCTIONS

    // Insert Device with it's corresponding certificate
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


    // Update Token and Expiration Date
    updateToken: function (obj, callback) {
        db.collection('device').update({ _id: mongo.helper.toObjectID(obj._id) }, { token: obj.token, expirationdate: obj.expDate }, function (err, nbRow) {
            console.log('Token is updated!');
            callback(err, nbRow);
        });
    },


    // Update Certificate Key
    certificateKey: function (obj, callback) {
        db.collection('device').update({ _id: mongo.helper.toObjectID(obj._id) }, { certificatekey: obj.certfkey }, function (err, nbRow) {
            console.log('Certificate key is updated!');
            callback(err, nbRow);
        });
    },


    // Get Path to certificate
    certificatePath: function (obj, callback) {
        db.collection('device').update({ _id: mongo.helper.toObjectID(obj._id) }, { pathtocertificate: obj.path }, function (err, nbRow) {
            console.log('Path to the Certificate is updated!');
            callback(err, nbRow);
        });
    },


    // Push software into the chosen device
    addNewSoftware: function (obj, callback) {
        db.collection('device').update({ _id: mongo.helper.toObjectID(obj._id) }, { "$addToSet": { "softwarelist": obj.newsoftware } }, function (err, nbRow) {
            console.log('Softwarelist of device', obj._id, 'is updated!');
            callback(err, nbRow);
        });
    },


    // Update the installed version of RED
    updateVersion: function (obj, callback) {
        db.collection('device').update({ _id: mongo.helper.toObjectID(obj._id) }, { installedversionRED: obj.v }, function (err, nbRow) {
            console.log('Installed version of RED is updated for device ', obj._id);
            callback(err, nbRow);
        });
    },

    //var obj = {_id: "string", datatype: "string", value: "string"}
    // Push data into the chosen device
    pushData: function (obj, callback) {
        db.collection('device').findOne({ _id: mongo.helper.toObjectID(obj._id) }, function (err, res) {
            if (res != undefined) {
                var today = new Date();
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

    //var obj = {_id: "string", datatype: "string"}
    // Get data of specified device according to the specific datatype
    pullDatatype: function (obj, callback) {
        db.collection('device').findOne({ "_id": mongo.helper.toObjectID(obj._id), "data.datatype": obj.datatype }, { "data": { $slice: -1 } }, function (err, result) {
            if (err) console.log(err);
            
            var toReturn = {
                value: result.data[0].value,
                date: result.data[0].date
            }
            callback(err, toReturn);
        })
    },


    // Get data of specified device according to the specific datatype and date
    pullDatatypeAndDate: function (obj, callback) {
        db.collection('device').findOne({ "_id": mongo.helper.toObjectID(obj._id), "data.datatype": obj.datatype, "data.date": obj.date }, function (err, result) {
            if (err) console.log(err);
            
            var toReturn = {
                value: result.data[0].value,
                date: result.data[0].date
            }
            
            callback(err, toReturn);
        });
    },

    //////////////////////////PERMISSIONS ON DEVICES

    // Insert a new permission
    insertPermission: function (permission, callback) {
        db.collection('permissions').insert(permission, function (err, result) {
            if (result) console.log('A new permission is added!');
            callback(err, result);
        });
    },


    // Get the user's permissions
    pullUserPermission: function (obj, callback) {
        db.collection('permissions').find({ userid: obj.userid }).toArray(function (err, result) {
            callback(err, result);
        });
    },


    // Update a user's permission on a device
    updatePermission: function (obj, callback) {
        db.collection('permissions').update({ _id: mongo.helper.toObjectID(obj._id), userid: obj.userid }, { permission: obj.permission }, function (err, nbRow) {
            console.log('Permissions given to device ', obj._id, 'is updated!');
            callback(err, nbRow);
        });
    },


    ///////////////////////////////////////////////////TO DELETE////////////////////////////
    find: function (id, callback) {
        db.collection('device').find({ _id: mongo.helper.toObjectID(id) }).toArray(function (err, result) {
            callback(err, result);
        });
    }
}
module.exports = app;
