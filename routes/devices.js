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
 *        401:
 *          description: unauthorized, the certificate is missing or wrong
 *        404:
 *          description: value asked not found
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
 *  /device/result/{id}:
 *    get:
 *      tags: [devDevices]
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
 *  /device/update/{id}:
 *    get:
 *      tags: [Devices]
 *      description: Get the last version of the library
 *      produces:
 *        - application/json
 *      parameters:
 *        - name: id
 *          description: value type
 *          in : path
 *          required : true
 *          schema:
 *            type: string
 *
 *      responses:
 *        200:
 *          description: Return the URl of the trusty repository
 *        401:
 *          description: unauthorized, the certificate is missing or wrong
 *        404:
 *          description: value asked not found
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
 *  /device/new/{nb}:
 *    get:
 *      tags: [Devices]
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

/*router.get('/device/new/:nb', function (req, res) {

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
});*/

/* GET data from other device represented by it's id and that match the datatype (aka key) (need permissions)*/

/**
 *  @swagger
 *  /device/other/{id}/{datatype}:
 *    get:
 *      tags: [Devices]
 *      description: Get the data that match the data type requested and his id, in the last sample of data
 *      produces:
 *        - application/json
 *      parameters:
 *        - name: id
 *          description: id of the device targeted doing the request
 *          in : path
 *          required : true
 *          schema:
 *            type: string
 *        - name: datatype
 *          description:
 *          in : path
 *          required: true
 *          schema:
 *            type: string
 *      responses:
 *        200:
 *          description: value corresponding to datatype and date sent in parameter
 *        401:
 *          description: unauthorized, the certificate is missing or wrong
 *        404:
 *          description: value asked not found
 *
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
 *  /device/other/{id}/{datatype}/{date}:
 *    get:
 *      tags: [Devices]
 *      description: Get more specific data form a dated sample and a specific data type, The date is a time stamp.
 *      produces:
 *        - application/json
 *      parameters:
 *        - name: id
 *          description: id of the device targeted doing the request
 *          in : path
 *          required : true
 *          schema:
 *            type: string
 *        - name: datatype
 *          description: Type of the data you request
 *          in : path
 *          required: true
 *          schema:
 *            type: string
 *        - name: date
 *          description: Timestamp in milliseconds which value is the time when the data was saved.
 *          in : path
 *          required: true
 *          schema:
 *            type: string
 *
 *      responses:
 *        200:
 *          description: value corresponding to datatype and date sent in parameter
 *        401:
 *          description: unauthorized, the certificate is missing or wrong
 *        404:
 *          description: value asked not found
 *
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
 *  /device/other/{id}:
 *    post:
 *      tags: [Devices]
 *      description: Post specific data to all the pool of devices
 *      produces:
 *        - application/json
 *      parameters:
 *        - name: id
 *          description: id of the device targeted doing the request
 *          in : path
 *          required : true
 *          schema:
 *            type: string
 *
 *      responses:
 *        200:
 *          description: value corresponding to datatype and date sent in parameter
 *        401:
 *          description: unauthorized, the certificate is missing or wrong
 *        404:
 *          description: value asked not found
 *
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
 *  /device/{datatype}:
 *    get:
 *      tags: [Devices]
 *      description: Get the most recent value matching the data type
 *      produces:
 *        - application/json
 *      parameters:
 *        - name: datatype
 *          description: value type
 *          in : path
 *          required : true
 *          schema: 
 *            type: string
 *      responses:
 *        200:
 *          description: most recent value corresponding to datatype sent in parameter
 *        401:
 *          description: unauthorized, the certificate is missing or wrong
 *        404:
 *          description: value asked not found
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
 *  /device/{datatype}/{date}:
 *    get:
 *      tags: [Devices]
 *      description: Get the most recent value matching the date & the data type. 
 *      produces:
 *        - application/json
 *      parameters:
 *        - name: datatype
 *          description: value type
 *          in : path
 *          required : true
 *          schema: 
 *            type: string
 *        - name: date
 *          description: date on which the value has been saved in the database
 *          in : path
 *          required: true
 *          schema:
 *            type: string 
 *      responses:
 *        200:
 *          description: value corresponding to datatype and date sent in parameter
 *        401:
 *          description: unauthorized, the certificate is missing or wrong
 *        404:
 *          description: value asked not found
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

router.post('/device', function (req, res) {
    //Create the object containing fields to search for
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

module.exports = router;
