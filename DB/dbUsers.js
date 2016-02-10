var db = require('./connect');
var express = require('express');
var jwt = require('jsonwebtoken');  //https://npmjs.org/package/node-jsonwebtoken
var expressJwt = require('express-jwt'); //https://npmjs.org/package/express-jwt
var fs = require('fs');
/* 
var user = {
  _id: String,
  username: String,
  password: String,
  salt : String,
  token: String,
  devices : [ String ],
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
exports.authUser = function (obj) {
    //First verify the token then make a search

    //Getting the certificate
    var cert = fs.readFileSync('../../CERTS/token.key');

    //Verifying the token if it is expired 
    jwt.verify(obj, cert, { algorithms: ['RS256'] , ignoreExpiration: false }, function(err, decoded) {
      if(err) { //Checking features of token (the expiration date)
        return false;
      //console.log(decoded); //To see what it contains
      //res.send(decoded);
      }
      else{
        //Search and match
        db.collection('user').findOne({ token: obj }, function (err, res) {
          if (res != null ) 
            return true;
          else 
            return false;
        });
      }   
    });
}

////////////////////////////////////PERMISSIONS ON USERS