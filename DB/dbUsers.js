var db = require('./connect');
/* 
var user = {
  _id: String,
  username: String,
  password: String,
  token: String,
  expirationdate: Number
}
*/

//////////////////////////USER FUNCTIONS

// Insert a new user
exports.insertUser = function (user, callback) {
    db.collection('user').insert(user, function (err, result) {
        if (result) console.log('A new user is added!');
        callback(err, result);
    });
}


// Get the user's data
exports.pullUser = function (obj, callback) {
    db.collection('user').find({ userid: obj.userid }).toArray(function (err, result) {
        callback(err, result);
    });
}


// Update a user
exports.updateUser = function (obj, callback) {
    db.collection('user').update({ deviceid: obj.deviceid }, { username: obj.username, password: obj.password, token: obj.token, expirationdate: obj.expirationdate }, function (err, nbRow) {
        console.log('User ', obj.deviceid, 'is updated!');
        callback(err, nbRow);
    });
}

// Authenticate User
exports.authUser = function (obj, callback) {
    db.collection('user').findOne({ token: obj }, function (err, res) {  // also check the expiration date of the token
        if (res != null ) {
            return true;
        }
        else {
            callback(err, "Authorization Denied.");
            return false;
        }
    });
}

////////////////////////////////////PERMISSIONS ON USERS