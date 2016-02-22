var express = require('express');
var router = express.Router();
var path = require('path');
var async = require('async');
require('./response');

var devices = require('../red_modules/red-devices');
var certs = require('../red_modules/red-cert-generator');
var perm = require('../red_modules/red-permissions');
var red_users = require('../red_modules/red-users');

/*API FOR THE DEVICES AND THEIR PERMISSIONS */

/**@swagger
 * definition:
 *   NewPerm:
 *     type: object
 *     required:
 *       - id
 *       - datatype
 *       - value
 *     properties:
 *       id:
 *         type: string
 *       datatype:
 *         type: string
 *       value:
 *         type: string
 *
 */


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
 *          description: all information on the device connected
 *
 */ 
router.get('/device/result', function (req, res) {
    devices.find(req.device.id, function (err, result) {
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
 *          description: all information on the device connected
 */ 
// Get results from other devices (by id)
router.get('/device/result/:id', function (req, res) {
    devices.find(req.params.id, function (err, result) {
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
 *          description: return the last version name.
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
                devices.insertDeviceWithCert(device.path, device.passphrase, device.fingerprint, function (err, results) {
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
            //call devices data function to retrieve asked data
            devices.pullDatatype(condition, callback);
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
    //call devices data function to retrieve asked data
    devices.pullDatatypeAndDate(condition, callback);
  
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
    //we call devices data function that will take, the object, translate it into model object and then save it
    devices.pushData(device, callback);
  
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
    //call devices data function to retrieve asked data
    devices.pullDatatype(condition, callback);    

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
    //call devices data function to retrieve asked data
    devices.pullDatatypeAndDate(condition, callback);
  
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
 *      parameters:
 *        - name: body
 *          description: data scheme needed to be sent
 *          in: body
 *          required: true
 *          schema:
 *            $ref: '#/definitions/NewPerm'
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
    //we call devices data function that will take, the object, translate it into model object and then save it
    devices.pushData(device, callback);
  
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
    //call devices Data function that will retrieve data
    devices.pullUserPermission(condition, callback);
  
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
 *      parameters:
 *        - name: body
 *          description: data scheme needed to be sent
 *          in: body
 *          required: true
 *          schema:
 *            type: object
 *            required:
 *              - id
 *              - userid
 *              - permission
 *            properties:
 *              id:
 *                 type: string
 *              userid:
 *                 type: string
 *              permission:
 *                 type: string
 *
 *      responses:
 *        200:
 *          description: Get the number of changes done
 *
 *
 */
router.post('/permissions/new',  function (req, res) {
    //Create the object
    var permissions = {
        _id: req.body._id,
        userid: req.body.userid,
        permisssion: req.body.permission
    }
    devices.insertPermission(permissions, callback);

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
 *      tags: [Permissions]
 *      description: Post new permission for the user
 *      produces:
 *        - application/json
 *      parameters:
 *        - name: body
 *          description: data scheme needed to be sent
 *          in: body
 *          required: true
 *          schema:
 *            $ref: '#/definitions/NewPerm'
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
    devices.updatePermission(permissions, callback);
  
    //callback function
    function callback(err, result) {
        if (err)
            res.respond(err, 404);
        else
            res.respond(result);
    }
});

module.exports = router;
