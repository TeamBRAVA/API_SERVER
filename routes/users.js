var express = require('express');
var router = express.Router();
var path = require('path');
var async = require('async');
require('./response');

var devices = require('../red_modules/red-devices');
var certs = require('../red_modules/red-cert-generator');
var perm = require('../red_modules/red-permissions');
var red_users = require('../red_modules/red-users');

/*API FOR THE USERS AND THEIR PERMISSIONS */
/**@swagger
 * definition:
 *   DataNoId:
 *     type: object
 *     required:
 *       - datatype
 *       - value
 *     properties:
 *       datatype:
 *         type: string
 *       value:
 *         type: string
 *
 */

/**
 *  @swagger
 *  /user/device/add:
 *    post:
 *      tags: [Users]
 *      description: add a device to the user's list of devices
 *      produces:
 *        - application/json
 *      parameters:
 *        - name: body
 *          description: device's id
 *          in: body
 *          required: true
 *          schema: 
 *            type: string
 *      responses:
 *        200:
 *          description: A json document that contain all the data related to the device.
 *        401:
 *          description: unauthorized, the certificate is missing or wrong
 *        404:
 *          description: value asked not found
 *
 */
router.post('/user/device/add', function (req, res) {
    red_users.addDevice(req.body.id, req.user.id, callback);
    
    //callback function
    function callback(err, result) {
        console.log(err)
        if (err)
            res.respond("Could not add the device", 404);
        else
            res.respond(result);
    }
});

/**
 *  @swagger
 *  /user/device/all:
 *    get:
 *      tags: [Users]
 *      description: Get the list of all devices owned by the authenticated user and their data
 *      produces:
 *        - application/json
 *      responses:
 *        200:
 *          description: A json document that contain all the data related to the device.
 *        401:
 *          description: unauthorized, the certificate is missing or wrong
 *        404:
 *          description: value asked not found
 *
 */
router.get('/user/device/all', function (req, res) {
    // Get the users informations
    red_users.find(req.user.id, function (err, result) {
        if (err) {
            console.error(err);
            res.respond("Could not get the devices", 404);
        } else {
            var toSend = [];
            console.log(result.devices);
            
            //for each user's device, retrieve its informations
            result.devices.forEach(function (val, index, array) {
                devices.find(val, function (err, device) {
                    if (err) {
                        res.respond(err, 404);
                    } else {
                        //add each to an array that will be sent back
                        toSend.push(device);
                        
                        //if last device, send back the result
                        if (index == result.devices.length - 1) {
                            console.log(toSend);
                            res.respond(toSend);
                        }

                    }
                });
            });

        }
    });
});


/**
 *  @swagger
 *  /user/device/{id}:
 *    get:
 *      tags: [Users]
 *      description: Get the sample of data the device has produce
 *      produces:
 *        - application/json
 *      parameters:
 *        - name: id
 *          description: value type
 *          in : path
 *          required : true
 *          schema:
 *            type: integer
 *      responses:
 *        200:
 *          description: most recent value corresponding to datatype sent in parameter
 *        401:
 *          description: unauthorized, the certificate is missing or wrong
 *        404:
 *          description: value asked not found
 *
 */
// Get results from other devices (by id)
router.get('/user/device/:id', function (req, res) {

    var from = { user: req.user.id };
    var to = { device: req.params.id };
    
    
    perm.checkRules(from, to, function (err, result) {
        if (err) {
            console.log(err)
            res.respond("Data not found", 404);
            return;
        }
        if (result == true) {
            console.log("checkRules ok");
            //call devices data function to retrieve asked data
            devices.find(req.params.id, callback);
        } else {
            res.respond("Unauthorized", 403);    // Forbidden
        }
    });
    
    //callback function
    function callback(err, result) {
        if (err){
            console.log(err);
            res.respond({err : "Could not load the data"}, 404);
        }
        else
            res.respond(result);
    }
});

/**
 *  @swagger
 *  /user/device/new/{nb}:
 *    get:
 *      tags: [Users]
 *      description:  Create new devices with the corresponding certs inside de database
 *      produces:
 *        - application/json
 *      parameters:
 *        - name: nb
 *          description: quantity of new devices to create
 *          in : path
 *          required : true
 *          schema:
 *            type: integer
 *      responses:
 *        200:
 *          description: Return a link to download the created certificate.
 *        401:
 *          description: unauthorized, the certificate is missing or wrong
 *        404:
 *          description: value asked not found
 */

router.get('/user/device/new/:nb', function (req, res) {

    // Set some absolute path
    certs.setCA(path.join(__dirname, '../CERTS/CA/ca.pem'), path.join(__dirname, '../CERTS/CA/ca.key'), "Ek12Bb@.");
    certs.setCertsFolder(path.join(__dirname, '../CERTS/DEVICES'));

    // Generate the certs
    certs.generateCertificates(req.params.nb, function () {

        // create devices inside the database
        certs.createDevices(function (err, devices) {
            var nb = 0;
            // Insert in the database
            async.each(devices, function (device, callback) {
                devices.insertDeviceWithCert(device.path, device.passphrase, device.fingerprint, function (err, results) {
                    if (!err)
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

/* POST new data on the server */
/**
 *  @swagger
 *  /user/device:
 *    post:
 *      tags: [Users]
 *      description: Save data correpondong to a certain device
 *      produces:
 *        - application/json
 *      parameters:
 *        - name: body
 *          description: object containing the datatype and value to add inside the database
 *          in: body
 *          required: true
 *          schema:
 *            $ref: '#/definitions/DataNoId'
 *      responses:
 *        200:
 *          description: amount of modified elements
 *        401:
 *          description: unauthorized, the certificate is missing or wrong
 *        404:
 *          description:  error message indicating the type of error
 *
 */

router.post('/user/device', function (req, res) {
    //Create the object containing fields to search for
    var device = {
        _id: req.body.id,
        datatype: req.body.datatype,
        value: req.body.value,
    }
    
    //check if the user authenticated has the permission to push data on this device
    var from = { user: req.user.id };
    var to = { device: req.body.id };

    perm.checkRules(from, to, function (err, result) {
        if (err) {
            console.log(err)
            res.respond("Data not found", 500);
            return;
        }
        if (result == true) {
            //we call devices data function that will take, the object, translate it into model object and then save it
            devices.pushData(device, callback);
        } else {
            res.respond("Unauthorized", 403);    // Forbidden
        }
    });
    
    //callback function
    function callback(err, result) {
        if (err){
            console.log(err);
            res.respond("Could not load the data", 404);
        }
        else
            res.respond(result);
    }
});

/* GET user permissions data identified with userid */
/**
 *  @swagger
 *  /user/device/permissions/:userid:
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
router.get('/user/permissions/:userid', function (req, res) {
    //get from url which user we want
    var condition = {
        "userid": req.params.userid,
    };
    //call devices Data function that will retrieve data
    devices.pullUserPermission(condition, callback);
  
    //callback function
    function callback(err, result) {
        if (err){
            console.log(err);
            res.respond("Could not load the data", 404);
        }
            
        else
            res.respond(result);
    }
});

/* POST new permissions for a user on a certain device */
/**
 *  @swagger
 *  /user/permission/new:
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
router.post('/user/permissions/new', function (req, res) {
    //Create the object
    var permissions = {
        _id: req.body._id,
        userid: req.body.userid,
        permisssion: req.body.permission
    }
    perm.insert(permissions, callback);

    //callback function
    function callback(err, result) {
        if (err){
            console.log(err);
            res.respond("error with permissions", 404);
        }
        else
            res.respond(result);
    }
});



/* POST to update existing permissions*/
/**
 *  @swagger
 *  /user/permissions/update:
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
router.post('/user/permissions/update', function (req, res) {
    //Create the object
    var permissions = {
        _id: req.body._id,
        userid: req.body.userid,
        permisssion: req.body.permission
    }
    devices.updatePermission(permissions, callback);
  
    //callback function
    function callback(err, result) {
        if (err){
            console.log(err);
            res.respond("error with permissions", 404);
        }
        else
            res.respond(result);
    }
});

/*ADMIN ROUTE, manage the permissions requests at a higher level*/
router.get('/user/permissions/pending', function (req, res) {
    //admin can see which permissions requests have a pending status.
})

module.exports = router;
