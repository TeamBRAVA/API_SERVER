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

// Middleware Auth. Function
function ensureAuthenticated(req, res, next){

    var bearerToken;
    var bearerHeader = req.headers["authorization"];

    if (typeof bearerHeader !== 'undefined') {
        var bearer = bearerHeader.split(" ");
        bearerToken = bearer[1];
        
        if (red_users.validateToken(bearerToken)){
            next(); //call devices Data function that will retrieve data
        }
        else{
            res.status(401).send({message: 'Invalid Token'});
        } 
    }
    else{
        res.status(401).send({message: 'Invalid Token'});
    }
};
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
 *      tags: [devDevices]
 *      description: Get the result from all the pool of  devices, all the data it already produce
 *      produces:
 *        - application/json
 *
 *      responses:
 *        200:
 *          description: A json document that contain all the data related to the device.
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
 *      tags: [devDevices]
 *      description: Get the sample of data the device has produce
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
 *            properties:
 *              id:
 *                 type: string
 *
 *      responses:
 *        200:
 *          description: Get the last sample of data produce by the device identified.
 *
 *
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
 *  /device/update/:id:
 *    get:
 *      tags: [Devices]
 *      description: ask for the last version
 *      produces:
 *        - application/json
 *
 *      responses:
 *        200:
 *          description: Return a url to the trusty version
 *        401:
 *          description: Unauthorized, the certificate is missing or wrong.
 *        403:
 *          description: Forbidden, the request is out of your boundaries
 *
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
 *      description: Create a certain number of new trusted certificate
 *      produces:
 *        - application/json
 *      parameters:
 *        - name: path
 *          description: data scheme needed to be sent
 *          in: body
 *          required: true
 *          schema:
 *            type: object
 *            required:
 *              - id
 *            properties:
 *              id:
 *                 type: integer
 *      responses:
 *        200:
 *          description: return a url to download the certificate created.
 *        401:
 *          description: unauthorized, the certificate is missing or wrong.
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
 *      description: Get the data that match the data type requested, in the last sample of data
 *      produces:
 *        - application/json
 *      parameters:
 *        - name: body
 *          description: data scheme needed to be sent
 *          in: path
 *          required: true
 *          schema:
 *            type: object
 *            required:
 *              - id
 *              - datatype
 *            properties:
 *              id:
 *                 type: integer
 *              datatype:
 *                 type: string
 *      responses:
 *        200:
 *          description: return in a json format the data asked.
 *        401:
 *          description: unauthorized, the certificate is missing or wrong.
 *        403:
 *          description: Forbidden, the request is out of your boundaries.
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
 *      description: Get more specific data form a dated sample and a specific data type, The date is a time stamp.
 *      produces:
 *        - application/json
 *      parameters:
 *        - name: body
 *          description: data scheme needed to be sent
 *          in: path
 *          required: true
 *          schema:
 *            type: object
 *            required:
 *              - id
 *              - datatype
 *              - date
 *            properties:
 *              id:
 *                 type: integer
 *              datatype:
 *                 type: string
 *              date:
 *                 type: string
 *      responses:
 *        200:
 *          description: Return a json document with the data.
 *        401:
 *          description: Unauthorized, the certificate is missing or wrong.
 *        403:
 *          description: Forbidden, the request is out of your boundaries.
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
 *      description: Post specific data to all the pool of devices
 *      produces:
 *        - application/json
 *      parameters:
 *        - name: path
 *          description: data scheme needed to be sent
 *          in: body
 *          required: true
 *          schema:
 *            type: object
 *            required:
 *              - id
 *            properties:
 *              id:
 *                 type: integer
 *
 *      responses:
 *        200:
 *          description: Return number of devices receiving the data.
 *        401:
 *          description: Unauthorized, the certificate is missing or wrong.
 *        403:
 *          description: Forbidden, the request is out of your boundaries.
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
 *      description: Get more specific data form a dated sample and a specific data type, The date is a time stamp.
 *      produces:
 *        - application/json
 *      parameters:
 *        - name: body
 *          description: data scheme needed to be sent
 *          in: path
 *          required: true
 *          schema:
 *            type: object
 *            required:
 *              - id
 *            properties:
 *              id:
 *                 type: integer
 *      responses:
 *        200:
 *          description: Return a json document with the data.
 *        401:
 *          description: Unauthorized, the certificate is missing or wrong.
 *        403:
 *          description: Forbidden, the request is out of your boundaries.
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
 *  /device/other/:id/:datatype/:date:
 *    get:
 *      tags: [Devices]
 *      description: Get more specific data form a dated sample and a specific data type, The date is a time stamp.
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
 *              - datatype
 *              - date
 *            properties:
 *              id:
 *                 type: integer
 *              datatype:
 *                 type: string
 *              date:
 *                 type: string
 *      responses:
 *        200:
 *          description: Return a json document with the data.
 *        401:
 *          description: Unauthorized, the certificate is missing or wrong.
 *        403:
 *          description: Forbidden, the request is out of your boundaries.
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
