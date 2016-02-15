var express = require('express');
var router = express.Router();
require('./response');
var db = require('../DB/dbDevices');
var path = require('path');
var async = require('async');

var certs = require('../red_modules/red-cert-generator/index.js');
var perm = require('../red_modules/red-permissions/index.js');

/*API FOR THE DEVICES AND THEIR PERMISSIONS */

// Middleware Auth. Function
function ensureAuthenticated(req, res, next){

    var bearerToken;
    var bearerHeader = req.headers["authorization"];

    if (typeof bearerHeader !== 'undefined') {
        var bearer = bearerHeader.split(" ");
        bearerToken = bearer[1];
        
        if (db.authUser(bearerToken)){
            next(); //call db Data function that will retrieve data
        }
        else{
            res.status(401).send({message: 'Invalid Token'});
        } 
    }
    else{
        res.status(401).send({message: 'Invalid Token'});
    }
};

////////////////////////////////////////////////////////////////////////////////
/*dev code (TO DELETE)*/
/**
 *  @swagger
 *  /device/result:
 *    get:
 *      tags: [Devices]
 *      description: Get results from device itself
 *      produces:
 *        - application/json
 *      responses:
 *        200:
 *          description: all informations on the device connected
 *
 */ 
router.get('/device/result', function (req, res) {
    db.find(req.device.id, function (err, result) {
        if (err) return console.error(err);
        res.respond(result);
    });
});

/**
 *  @swagger
 *  /device/result/:id:
 *    get:
 *      tags: [Devices]
 *      description: Get results from self device
 *      produces:
 *        - application/json
 *      responses:
 *        200:
 *          description: all informations on the device connected
 */ 
// Get results from other devices (by id)
router.get('/device/result/:id', function (req, res) {
    db.find(req.params.id, function (err, result) {
        if (err) return console.error(err);
        res.respond(result);
    });
});
/////////////////////////////////////////////////////////////////////////////////////


//update the object **TO BE IMPLEMENTED**
/**
 *  @swagger
 *  /device/other/:id:
 *    get:
 *      tags: [Devices]
 *      description: look for update and apply if needed
 *      produces:
 *        - application/json
 *      responses:
 *        200:
 *          description: get the link to dl the update package
 *
 */
router.get('/device/update', function (req, res) {
    //call update function
  
    //callback function
    function callback(err, result) {
        if (err) return console.error(err);
        //todo create response
    }
});

// Create new devices with the corresponding certs inside de database ### OK ###
/**
 *  @swagger
 *  /device/new/:nb:
 *    get:
 *      tags: [Devices]
 *      description: Create new devices, associated to the certificates
 *      produces:
 *        - application/json
 *      responses:
 *        200:
 *          description: NONE
 */
router.get('/device/new/:nb', function (req, res) {

    // Set some absolute path
    certs.setCA(path.join(__dirname, '../CERTS/CA/ca.pem'), path.join(__dirname, '../CERTS/CA/ca.key'), "Ek12Bb@.");
    certs.setCertsFolder(path.join(__dirname, '../CERTS/DEVICES'));

    // Generate the certs
    certs.generateCertificates(req.params.nb, function() {

        // create devices inside the database
        certs.createDevices(function (err, devices) {
            var nb = 0;
            // Insert in the database
            async.each(devices, function (device, callback) {
                db.insertDeviceWithCert(device.path, device.passphrase, device.fingerprint, function (err, results) {
                    if(!err)
                        nb++;
                    else
                        console.log(err);
                    callback();
                });
            }, function done() {
                res.respond(nb + " certificates created", 200);
            });            
        });
    });
});

/* GET data from other device represented by it's id and that match the datatype (aka key) (need permissions)*/
/**
 *  @swagger
 *  /device/other/:id/:datatype:
 *    get:
 *      tags: [Devices]
 *      description: Get the data from on id , matching the data type
 *      produces:
 *        - application/json
 *      responses:
 *        200:
 *          description: data type
 *        403:
 *          description: Unauthorized access
 */
router.get('/device/other/:id/:datatype', function (req, res) {
    //get from url which data we want
    var condition = {
        "_id": req.params.id,
        "datatype": req.params.datatype
    };

    var access = {};
    access[req.params.datatype] = "read";
    var from = {device : req.device.id};
    var to = {device : req.params.id};

    perm.verify(from, to, access, function (err, result) {
        if(err) {
            res.respond(err, 500);
            return;
        }
        if(result == true) {
            //call db data function to retrieve asked data
            db.pullDatatype(condition, callback);
        } else {
            res.respond("Unauthorized to access data", 403);    // Forbidden
        }
    });

    //callback function
    function callback(err, result) {
        if (err)
            res.respond(err, 404);
        else
            res.respond(result);
    }
});


/* GET data identified with key and date from device : id (need permissions)*/
/**
 *  @swagger
 *  /device/other/:id/:datatype/:date:
 *    get:
 *      tags: [Devices]
 *      description: Get the data from on id , matching the data type and date
 *      produces:
 *        - application/json
 *      responses:
 *        200:
 *          description: data type
 *        403:
 *          description: Unauthorized access
 */
router.get('/device/other/:id/:datatype/:date', function (req, res) {
    //get from url which data we want
    var condition = {
        "_id": req.params.id,
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

/* POST data on the server for other devices represented by their id (need permissions)*/
/**
 *  @swagger
 *  /device/other/:id:
 *    post:
 *      tags: [Devices]
 *      description: Post data for linked devices
 *      produces:
 *        - application/json
 *      responses:
 *        200:
 *          description: ??the result ??
 *        403:
 *          description: Unauthorized access
 */
router.post('/device/other/:id', function (req, res) {
    //Create the object
    var device = {
        _id: req.params.id,
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


/* GET data from itself, that match the datatype (aka key)*/
/**
 *  @swagger
 *  /device/:datatype:
 *    get:
 *      tags: [Devices]
 *      description: Get data from itself, with the data type specified
 *      produces:
 *        - application/json
 *      responses:
 *        200:
 *          description: The specific data
 *
 */
router.get('/device/:datatype', function (req, res) {
    //get from url which data we want
    var condition = {
        "_id": req.device.id,
        "datatype": req.params.datatype
    };
    //call db data function to retrieve asked data
    db.pullDatatype(condition, callback);    

    //callback function
    function callback(err, result) {
        if (err)
            res.respond(err, 404);
        else
            res.respond(result);
    }    
});


/* GET data from itself, that match the datatype (aka key) and the date*/
/**
 *  @swagger
 *  /device/:datatype/:date:
 *    get:
 *      tags: [Devices]
 *      description: Get data from itself matching the date & the data type
 *      produces:
 *        - application/json
 *      responses:
 *        200:
 *          description: the specified data
 *
 */
router.get('/device/:datatype/:date', function (req, res) {
    //get from url which data we want
    var condition = {
        "_id": req.device.id,
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
/**
 *  @swagger
 *  /device:
 *    post:
 *      tags: [Devices]
 *      description: Post data
 *      produces:
 *        - application/json
 *      responses:
 *        200:
 *          description: return the number of modified element
 *
 */
router.post('/device', function (req, res) {
    //Create the object
    var device = {
        _id: req.device.id,
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



/* GET user permissions data identified with userid */
/**
 *  @swagger
 *  /device/permissions/:userid:
 *    get:
 *      tags: [Permissions]
 *      description: Get the permission of the user id provided
 *      produces:
 *        - application/json
 *      responses:
 *        200:
 *          description: permissions of the user
 *
 */
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
/**
 *  @swagger
 *  /permission/new:
 *    post:
 *      tags: [Permissions]
 *      description: Post new permission for a user on a specified device
 *      produces:
 *        - application/json
 *      responses:
 *        200:
 *          description:
 *
 */
router.post('/permissions/new',  function (req, res) {
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
/**
 *  @swagger
 *  /permissions/update:
 *    post:
 *      description: Post new permission for the user
 *      produces:
 *        - application/json
 *      responses:
 *        200:
 *          description:
 *
 */
router.post('/permissions/update',  function (req, res) {
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

module.exports = router;
