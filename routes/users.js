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
 *  /user/device/result:
 *    get:
 *      tags: [Users]
 *      description: Get the result from all the pool of  devices, all the data it already produce
 *      produces:
 *        - application/json
 *
 *      responses:
 *        200:
 *          description: A json document that contain all the data related to the device.
 *        401:
 *          description: unauthorized, the certificate is missing or wrong
 *        404:
 *          description: value asked not found
 *
 */
router.get('/user/device/result', function (req, res) {
    // Get all the id
    red_users.listDevices(req.user.token, function (err, result) {
        if (err) {
            console.error(err);
            return res.respond(err, 404);
        } else {
            devices.find(req.device.id, function (err, result) {
                if (err) return console.error(err);
                res.respond(result);
            });
        }
    })
});


/**
 *  @swagger
 *  /user/device/result/{id}:
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
router.get('/user/device/result/:id', function (req, res) {

    var from = { user: req.user.id };
    var to = { device: req.params.id };

    perm.checkRules(from, to, function (err, result) {
        if (err) {
            res.respond(err, 500);
            return;
        }
        if (result == true) {
            //call devices data function to retrieve asked data
            devices.find(req.params.id, callback);
        } else {
            res.respond("Unauthorized", 403);    // Forbidden
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

// Create new devices with the corresponding certs inside de database ### OK ###
/**
 *  @swagger
 *  /user/device/new/{nb}:
 *    get:
 *      tags: [Users]
 *      description: Get the most recent value matching the date & the data type.
 *      produces:
 *        - application/json
 *      parameters:
 *        - name: nb
 *          description: quantity of new certificate to create
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
 *      description: Save data of the device sending the request
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
            res.respond(err, 500);
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
        if (err)
            res.respond(err, 404);
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
        if (err)
            res.respond(err, 404);
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
        if (err)
            res.respond(err, 404);
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
        if (err)
            res.respond(err, 404);
        else
            res.respond(result);
    }
});

/*ADMIN ROUTE, manage the permissions requests at a higher level*/
router.get('/user/permissions/pending', function (req, res) {
    //admin can see which permissions requests have a pending status.
})

module.exports = router;
