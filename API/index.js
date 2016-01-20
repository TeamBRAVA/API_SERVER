var express = require('express');
var router = express.Router();
require('./response');
var db = require('../DB/dbData');

/* API for IOT */


//update the object
router.get('/API/device/update', function (req, res) {
    //call update function
  
    //callback function
    function callback(err, result) {
        if (err) return console.error(err);
        //todo create response
    }
});



/* GET data identified with key from device : id*/
router.get('/API/device/:deviceid/:datatype', function (req, res) {
    //get from url which data we want
    var condition = {
        "deviceid": req.params.deviceid,
        "datatype": req.params.datatype
    };
    //call db Data function that will retrieve data
    db.pullDatatype(condition, callback);
  
    //callback function
    function callback(err, result) {
        if (err)
            res.respond(err, 404);
        else
            res.respond(result);
    }
});



/* GET data identified with key and date from device : id*/
router.get('/API/device/:deviceid/:datatype/:date', function (req, res) {
    //get from url which data we want
    var condition = {
        "deviceid": req.params.deviceid,
        "datatype": req.params.datatype,
        "date": req.params.date
    };
    //call db data function to retrieve asked data
    db.pullDatatypeAndDate(condition, callback);
  
    //callback function
    function callback(err, result) {
        if (err)
            res.respond(err, 404);
        else
            res.respond(result);
    }
});



/* GET user permisssion data identified with userid */
router.get('/API/permissions/:userid', function (req, res) {
    //get from url which user we want
    var condition = {
        "userid": req.params.userid,
    };
    //call db Data function that will retrieve data
    db.pullUserPermission(condition, callback);
  
    //callback function
    function callback(err, result) {
        if (err)
            res.respond(err, 404);
        else
            res.respond(result);
    }
});



/* POST /data (OK)*/
//the body must have three values in it : deviceid, datatype
router.post('/API/device', function (req, res) {
    //Create the object
    var device = {
        deviceid: req.body.deviceid,
        datatype: req.body.datatype,
        value: req.body.value,
    }
    //we call db data function that will take, the object, translate it into model object and then save it
    db.pushData(device, callback);
  
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
router.post('/API/user/new', function (req, res) {
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
router.post('/API/user/update', function (req, res) {
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



/* POST permissions/data (OK)*/
//the body must have three values in it : deviceid, datatype, permission
router.post('/API/permissions/new', function (req, res) {
    //Create the object
    var permissions = {
        deviceid: req.body.deviceid,
        userid: req.body.userid,
        permisssion: req.body.permission
    }
    db.insertPermission(permissions, callback);
  
    //callback function
    function callback(err, result) {
        if (err)
            res.respond(err, 404);
        else
            res.respond(result);
    }
});



/* POST permissions/data (OK)*/
//the body must have three values in it : deviceid, datatype, permission
router.post('/API/permissions/update', function (req, res) {
    //Create the object
    var permissions = {
        deviceid: req.body.deviceid,
        userid: req.body.userid,
        permisssion: req.body.permission
    }
    db.updatePermission(permissions, callback);
  
    //callback function
    function callback(err, result) {
        if (err)
            res.respond(err, 404);
        else
            res.respond(result);
    }
});



////////////////////////////////////////////////////////////////////////////////
/*dev code (TO DELETE)*/

/* GET /data (OK)*/
router.get('/data', function (req, res) {

    var device = {
        deviceid: '1',
    }
    db.insertDevice(device, callback);
  
    //callback function
    function callback(err, result) {
        if (err)
            res.respond(err, 404);
        else
            res.respond(result);
    }
});

router.get('/result', function (req, res) {
    db.find(function (err, result) {
        if (err) return console.error(err);
        res.respond(result);
    })
});
/////////////////////////////////////////////////////////////////////////////////////

module.exports = router;