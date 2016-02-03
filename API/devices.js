var express = require('express');
var router = express.Router();
require('./response');
var db = require('../DB/dbDevices');

/*API FOR THE DEVICES AND THEIR PERMISSIONS */

//update the object **TO BE IMPLEMENTED**
router.get('/device/update', function (req, res) {
    //call update function
  
    //callback function
    function callback(err, result) {
        if (err) return console.error(err);
        //todo create response
    }
});



/* GET data identified with key from device : id*/
router.get('/device/:_id/:datatype', function (req, res) {
    //get from url which data we want
    var condition = {
        "_id": req.params._id,
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
router.get('/device/:_id/:datatype/:date', function (req, res) {
    //get from url which data we want
    var condition = {
        "_id": req.params._id,
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

/* POST new data on the server */
router.post('/device', function (req, res) {
    //Create the object
    var device = {
        _id: req.body._id,
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



/* GET user permisssions data identified with userid */
router.get('/permissions/:userid', function (req, res) {
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

/* POST new permissions for a user on a certain device */
router.post('/permissions/new', function (req, res) {
    //Create the object
    var permissions = {
        _id: req.body._id,
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



/* POST to update existing permissions*/
router.post('/permissions/update', function (req, res) {
    //Create the object
    var permissions = {
        _id: req.body._id,
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
router.get('/newDevice', function (req, res) {
    db.insertDevice(callback);
  
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