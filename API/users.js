var express = require('express');
var router = express.Router();
require('./response');
var db = require('../DB/dbUsers');


/* POST user/data (OK)*/
//the body must have three values in it : deviceid, datatype, permission
router.post('/user/new', function (req, res) {
    //Create the object
    var user = {
        userid: req.body.userid,
        token: req.body.token,
        expirationdate: req.body.expirationdate
    }
    db.insertUser(user, callback);
  
    //callback function
    function callback(err, result) {
        if (err)
            res.respond(err, 404);
        else
            res.respond(result);
    }
});


/* POST user/data (OK)*/
//the body must have three values in it : deviceid, datatype, permission
router.post('/user/update', function (req, res) {
    //Create the object
    var user = {
        userid: req.body.userid,
        token: req.body.token,
        expirationdate: req.body.expirationdate
    }
    db.updateUser(user, callback);
  
    //callback function
    function callback(err, result) {
        if (err)
            res.respond(err, 404);
        else
            res.respond(result);
    }
});

module.exports = router;