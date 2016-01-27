// To connect the database
var db = require('./connect');

//Data structure
/*var device = {
  deviceid: String,
  token: String,
  expirationdate: String,
  pathtocertificate: String,
  certificatekey: String,
  installedversionRED: String,
  softwarelist: [String], 
  data: [ { datatype: String, value: String, date: Date.now } ]
}

var user = {
  userid: String,
  username: String,
  password: String,
  token: String,
  expirationdate: String
}

var permissions = {
  deviceid: String,
  userid: String,
  permission: String
}

*/

//////////////////////////DEVICE FUNCTIONS

// Inserting a new device
exports.insertDevice = function (device, callback) {
    db.collection('device').insert(device, function (err, result) {
        if (result) console.log('A new device is added!');

        callback(err, result);
    });
}


// Token and Expiration Date
exports.updateToken = function (obj, callback) {
    db.collection('device').update({ deviceid: obj.deviceid }, { token: obj.token, expirationdate: obj.expDate }, function (err, nbRow) {
        console.log('Token is updated!');
        callback(err, nbRow);
    });
}


// Certificate Key
exports.certificateKey = function (obj, callback) {
    db.collection('device').update({ deviceid: obj.deviceid }, { certificatekey: obj.certfkey }, function (err, nbRow) {
        console.log('Certificate key is updated!');
        callback(err, nbRow);
    });
}


// Path to certificate
exports.certificatePath = function (obj, callback) {
    db.collection('device').update({ deviceid: obj.deviceid }, { pathtocertificate: obj.path }, function (err, nbRow) {
        console.log('Path to the Certificate is updated!');
        callback(err, nbRow);
    });
}


// Pushing software into the device chosen
exports.addNewSoftware = function (obj, callback) {
    db.collection('device').update({ deviceid: obj.deviceid }, { "$addToSet": { "softwarelist": obj.newsoftware } }, function (err, nbRow) {
        console.log('Softwarelist of device', obj.deviceid, 'is updated!');
        callback(err, nbRow);
    });
}


// Updating the installed version of RED
exports.updateVersion = function (obj, callback) {
    db.collection('device').update({ deviceid: obj.deviceid }, { installedversionRED: obj.v }, function (err, nbRow) {
        console.log('Installed version of RED is updated for device ', obj.deviceid);
        callback(err, nbRow);
    });
}


// Pushing data into the device chosen
exports.pushData = function (obj, callback) {

    db.collection('device').findOne({ deviceid: obj.deviceid }, function (err, res) {
        if (res != null) {
            var today = new Date();
            db.collection('device').update({ deviceid: obj.deviceid }, { '$push': { data: { datatype: obj.datatype, value: obj.value, date: today } } }, function (err, nbRow) {
                console.log('New data are pushed into device ', obj.deviceid);
                callback(err, nbRow);
            });
        }
        else {
            callback(err, "The device does not exist.");
        }
    });



}


// Getting the data of specified device according to the specific datatype
exports.pullDatatype = function (obj, callback) {
    db.collection('device').find({ "deviceid": obj.deviceid, "data.datatype": obj.datatype }, { "data": { $elemMatch: { datatype: obj.datatype } }, "data.value": 1, "_id": 0 }).toArray(function (err, result) {
        callback(err, result);
    });
}


// Getting the data of specified device according to the specific datatype and date
exports.pullDatatypeAndDate = function (obj, callback) {
    db.collection('device').find({ "deviceid": obj.deviceid, "data.datatype": obj.datatype, "data.date": obj.date }, { "data": { $elemMatch: { datatype: obj.datatype, date: obj.date } }, "data.value": 1, "_id": 0 }).toArray(function (err, result) {
        callback(err, result);
    });
}


//////////////////////////USER FUNCTIONS

// Inserting a new user
exports.insertUser = function (user, callback) {
    db.collection('user').insert(user, function (err, result) {
        if (result) console.log('A new user is added!');
        callback(err, result);
    });
}


// Getting the user's data
exports.pullUser = function (obj, callback) {
    db.collection('user').find({ userid: obj.userid }).toArray(function (err, result) {
        callback(err, result);
    });
}


// Updating a user
exports.updateUser = function (obj, callback) {
    var today = new Date();

    db.collection('user').update({ deviceid: obj.deviceid }, { token: obj.token, expirationdate: obj.expirationdate }, function (err, nbRow) {
        console.log('User ', obj.deviceid, 'is updated!');
        callback(err, nbRow);
    });
}


//////////////////////////PERMISSION FUNCTIONS

// Inserting a new permission
exports.insertPermission = function (permission, callback) {
    db.collection('permissions').insert(permission, function (err, result) {
        if (result) console.log('A new permission is added!');
        callback(err, result);
    });
}


// Getting the user's permission data
exports.pullUserPermission = function (obj, callback) {
    db.collection('permissions').find({ userid: obj.userid }).toArray(function (err, result) {
        callback(err, result);
    });
}


// Updating a permission
exports.updatePermission = function (obj, callback) {
    db.collection('permissions').update({ deviceid: obj.deviceid, userid: obj.userid }, { permission: obj.permission }, function (err, nbRow) {
        console.log('Permissions given to device ', obj.deviceid, 'is updated!');
        callback(err, nbRow);
    });
}


///////////////////////////////////////////////////TO DELETE////////////////////////////
exports.find = function (callback) {
    db.collection('device').find().toArray(function (err, result) {
        callback(err, result);
    })
}
