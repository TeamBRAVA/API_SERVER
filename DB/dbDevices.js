// To connect the database
var db = require('./connect');
/* 
Description: 

wiki: http://wiki.red.jankobox.fr
*/
/*
Data structure: 

var device = {
  _id: String,
  token: String,
  expirationdate: String,
  pathtocertificate: String,
  certificatekey: String,
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

//////////////////////////DEVICE FUNCTIONS

// Insert a new device
exports.insertDevice = function (callback) {
    db.collection('device').insert({}, function (err, result) {
        if(result.ok == 1){
            callback(err, result);
        }else callback(err, result.insertedIds);
    });
}


// Update Token and Expiration Date
exports.updateToken = function (obj, callback) {
    db.collection('device').update({ _id: obj._id }, { token: obj.token, expirationdate: obj.expDate }, function (err, nbRow) {
        console.log('Token is updated!');
        callback(err, nbRow);
    });
}


// Update Certificate Key
exports.certificateKey = function (obj, callback) {
    db.collection('device').update({ _id: obj._id }, { certificatekey: obj.certfkey }, function (err, nbRow) {
        console.log('Certificate key is updated!');
        callback(err, nbRow);
    });
}


// Get Path to certificate
exports.certificatePath = function (obj, callback) {
    db.collection('device').update({ _id: obj._id }, { pathtocertificate: obj.path }, function (err, nbRow) {
        console.log('Path to the Certificate is updated!');
        callback(err, nbRow);
    });
}


// Push software into the chosen device
exports.addNewSoftware = function (obj, callback) {
    db.collection('device').update({ _id: obj._id }, { "$addToSet": { "softwarelist": obj.newsoftware } }, function (err, nbRow) {
        console.log('Softwarelist of device', obj._id, 'is updated!');
        callback(err, nbRow);
    });
}


// Update the installed version of RED
exports.updateVersion = function (obj, callback) {
    db.collection('device').update({ _id: obj._id }, { installedversionRED: obj.v }, function (err, nbRow) {
        console.log('Installed version of RED is updated for device ', obj._id);
        callback(err, nbRow);
    });
}


// Push data into the chosen device
exports.pushData = function (obj, callback) {

    db.collection('device').findOne({ _id: obj._id }, function (err, res) {
        if (res != null) {
            var today = new Date();
            db.collection('device').update({ _id: obj._id }, { '$push': { data: { datatype: obj.datatype, value: obj.value, date: today } } }, function (err, nbRow) {
                console.log('New data are pushed into device ', obj._id);
                callback(err, nbRow);
            });
        }
        else {
            callback(err, "The device does not exist.");
        }
    });



}


// Get data of specified device according to the specific datatype
exports.pullDatatype = function (obj, callback) {
    db.collection('device').find({ "_id": obj._id, "data.datatype": obj.datatype }, { "data": { $elemMatch: { datatype: obj.datatype } }, "data.value": 1, "_id": 0 }).toArray(function (err, result) {
        callback(err, result);
    });
}


// Get data of specified device according to the specific datatype and date
exports.pullDatatypeAndDate = function (obj, callback) {
    db.collection('device').find({ "_id": obj._id, "data.datatype": obj.datatype, "data.date": obj.date }, { "data": { $elemMatch: { datatype: obj.datatype, date: obj.date } }, "data.value": 1, "_id": 0 }).toArray(function (err, result) {
        callback(err, result);
    });
}

//////////////////////////PERMISSIONS ON DEVICES

// Insert a new permission
exports.insertPermission = function (permission, callback) {
    db.collection('permissions').insert(permission, function (err, result) {
        if (result) console.log('A new permission is added!');
        callback(err, result);
    });
}


// Get the user's permissions
exports.pullUserPermission = function (obj, callback) {
    db.collection('permissions').find({ userid: obj.userid }).toArray(function (err, result) {
        callback(err, result);
    });
}


// Update a user's permission on a device
exports.updatePermission = function (obj, callback) {
    db.collection('permissions').update({ _id: obj._id, userid: obj.userid }, { permission: obj.permission }, function (err, nbRow) {
        console.log('Permissions given to device ', obj._id, 'is updated!');
        callback(err, nbRow);
    });
}


///////////////////////////////////////////////////TO DELETE////////////////////////////
exports.find = function (callback) {
    db.collection('device').find().toArray(function (err, result) {
        callback(err, result);
    })
}
