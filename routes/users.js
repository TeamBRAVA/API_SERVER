var express = require('express');
var router = express.Router();
var path = require('path');
var util = require('util');
var async = require('async');
var multer = require('multer');
require('./response');

var devices = require('../red_modules/red-devices');
var softwares = require('../red_modules/red-repository');
var certs = require('../red_modules/red-cert-generator');
var perm = require('../red_modules/red-permissions');
var red_users = require('../red_modules/red-users');



var storage = multer.diskStorage({ //multers disk storage settings
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../uploads/'));
    },
    filename: function (req, file, cb) {
        var datetimestamp = Date.now();
        cb(null, file.fieldname + '-' + datetimestamp + '.' + file.originalname.split('.')[file.originalname.split('.').length -1]);
    }
});

var upload = multer({storage: storage}).single('file');


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
 *  /user/info:
 *    get:
 *      tags: [Users]
 *      description: add a device to the user's list of devices
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
router.get('/info', function (req, res) {
    red_users.findSummary(req.user.id, callback);

    //callback function
    function callback(err, result) {
        console.log(err)
        if (err)
            res.respond("Could not find the user summary", 404);
        else
            res.respond(result);
    }
});


/**
 *  @swagger
 *  /user/software/list:
 *    get:
 *      tags: [Users]
 *      description: List all the softwares from a user without obsolete ones
 *      produces:
 *        - application/json
 *      responses:
 *        200:
 *          description: A json document that contain all the data related to the softwares
 *        401:
 *          description: unauthorized, the certificate is missing or wrong
 *        404:
 *          description: value asked not found
 *
 */
router.get('/software/list', function (req, res) {
    softwares.list(req.user.id, callback);

    //callback function
    function callback(err, result) {
        if (err) {
            console.log(err);
            res.respond("Could not find the list of softwares", 404);
        } else
            res.respond(result);
    }
});

/**
 *  @swagger
 *  /user/software/list/all:
 *    get:
 *      tags: [Users]
 *      description: List all the softwares from a user with obsoletes ones
 *      produces:
 *        - application/json
 *      responses:
 *        200:
 *          description: A json document that contain all the data related to the softwares
 *        401:
 *          description: unauthorized, the certificate is missing or wrong
 *        404:
 *          description: value asked not found
 *
 */
router.get('/software/list/all', function (req, res) {
    softwares.listAll(req.user.id, callback);

    //callback function
    function callback(err, result) {
        if (err) {
            console.log(err);
            res.respond("Could not find the list of softwares", 404);
        } else
            res.respond(result);
    }
});

/**
 *  @swagger
 *  /user/software/{id}:
 *    get:
 *      tags: [Users]
 *      description: return all the informations on the software identified by the id
 *      produces:
 *        - application/json
 *      responses:
 *        200:
 *          description: A json document that contain all the data related to the software
 *        401:
 *          description: unauthorized, the token is missing or wrong
 *        404:
 *          description: software asked not found
 *
 */
router.get('/software/:id', function (req, res) {
    softwares.findSoftware(req.params.id, callback);

    //callback function
    function callback(err, result) {
        if (err) {
            console.log(err);
            res.respond("Could not find the software", 404);
        } else
            res.respond(result);
    }
});

/**
 *  @swagger
 *  /user/software/add:
 *    post:
 *      tags: [Users]
 *      description: Upload a new software to the software list of the user
 *      produces:
 *        - application/json
 *      parameters:
 *        - name: name
 *          description: software name
 *          in: body
 *          required: true
 *          schema: 
 *            type: string
 *        - name: version
 *          description: software version
 *          in: body
 *          required: true
 *          schema: 
 *            type: string
 *        - name: description
 *          description: software short description
 *          in: body
 *          required: true
 *          schema: 
 *            type: string
 *        - name: file
 *          description: software file (file upload as post)
 *          in: body
 *          required: true
 *          schema: 
 *            type: string
 *      responses:
 *        200:
 *          description: A json document that contain information about the uploaded software
 *        401:
 *          description: unauthorized, the certificate is missing or wrong
 *        404:
 *          description: value asked not found
 *
 */
router.post('/software/add', function (req, res) {
    upload(req,res,function(err){
        if(err){
            res.respond("Internal error while uploaded the file", 500);
            return;
        }

        softwares.copy(req.file.path, function (err, chemin) {
            softwares.add({name: req.body.name, version: req.body.version, desc: req.body.description, path: chemin}, req.user.id, function (err) {
                if(err) {
                    res.respond("Could not save the software", 500);
                }
                res.respond("file uploaded and stored");
            });
        });
    });
});


/**
 *  @swagger
 *  /user/device/add:
 *    post:
 *      tags: [Users]
 *      description: add a device to the user's list of devices
 *      produces:
 *        - application/json
 *      parameters:
 *        - name: id
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
router.post('/device/add', function (req, res) {
    red_users.addDevice(req.body.id, req.user.id, callback);
    
    //callback function
    function callback(err, result) {
        if (err) {
            console.log(err);
            res.respond("Could not add the device", 404);
        } else
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
router.get('/device/all', function (req, res) {
    // Get the users informations
    red_users.find(req.user.id, function (err, result) {
        if (err) {
            console.error(err);
            res.respond("Could not get the devices", 404);
        } else {
            var toSend = [];
            
            //for each user's device, retrieve its informations
            async.each(result.devices, function (device, callback) {
                devices.findData(device, function (err, d) {
                    if (err) {
                        res.respond(err, 404);
                    } else {
                        //add each to an array that will be sent back
                        toSend.push(d);
                        callback();
                    }
                });
            }, function done () {
                console.log(toSend);
                res.respond(toSend);
            });
        }
    });
});


/**
 *  @swagger
 *  /user/device/list:
 *    get:
 *      tags: [Users]
 *      description: Get the list of all devices owned by the authenticated user
 *      produces:
 *        - application/json
 *      responses:
 *        200:
 *          description: A json document that contain all the related devices. {list.[deviceIDList]}
 *        401:
 *          description: unauthorized, the certificate is missing or wrong
 *        404:
 *          description: value asked not found
 *
 */
router.get('/device/list', function (req, res) {
    // Get the users informations
    red_users.find(req.user.id, function (err, result) {
        if (err) {
            console.error(err);
            res.respond("Could not get the list of devices", 404);
        } else {
            res.respond({list : result.devices});
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
router.get('/device/:id', function (req, res) {

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
            devices.findData(req.params.id, callback);
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
 *  /user/device/summary{id}:
 *    get:
 *      tags: [Users]
 *      description: Get the sample of data the device has produce
 *      produces:
 *        - application/json
 *      parameters:
 *        - name: id
 *          description: the id of the object to get the summary
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
router.get('/device/summary/:id', function (req, res) {

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
            var errors = [];
            var results = {};
            //call devices data function to retrieve asked data
            async.parallel([
                function (cb) {
                    devices.find(req.params.id, function (err, r) {
                        if(err) errors.push(err);
                        else {
                            // copy an object
                            for (var key in r) {
                                results[key] = r[key];
                            }
                        }
                        cb();
                    });
                },
                function (cb) {
                    red_users.findDeviceUsers(req.params.id, function (err, r) {
                        if(err) errors.push(err);
                        else results.users = r.length;
                        cb();
                    });
                },
                function (cb) {
                    perm.list('device', req.params.id, function (err, r) {
                        if(err) errors.push(err);
                        else results.permissions = r.requestor.length + r.target.length;
                        cb();
                    });
                }
                ], function (err) {
                    callback(errors, results);
                });
            
        } else {
            res.respond("Unauthorized", 403);    // Forbidden
        }
    });
    
    //callback function
    function callback(err, result) {
        if (err.length > 0){
            console.log(err);
            res.respond({err : "Could not load the data"}, 404);
        }
        else
            res.respond(result);
    }
});


/**
 *  @swagger
 *  /user/device/certificate/{nb}:
 *    get:
 *      tags: [Users]
 *      description:  Create new devices with the corresponding certs inside de database
 *      produces:
 *        - application/octet-stream
 *      parameters:
 *        - name: id
 *          description: the device id which is bundle to the certificate
 *          in : path
 *          required : true
 *          schema:
 *            type: integer
 *      responses:
 *        200:
 *          description: return the certificate file.
 *        401:
 *          description: unauthorized, the certificate is missing or wrong
 *        404:
 *          description: value asked not found
 */
router.get('/device/certificate/:id', function (req, res) {
    devices.getCertificatePath({id: req.params.id, owner: req.user.id}, function (err, result) {
        if(err) {
            console.log(err);
            res.respond("Internal server error", 500);
            return; 
        }
        if(result) {
            res.sendFile(result.certificate.path);
        } else {
            res.respond("You don't own the object", 404);
            return;
        }
    });
});

/**
 *  @swagger
 *  /user/device/certificate/passphrase/{nb}:
 *    post:
 *      tags: [Users]
 *      description:  Create new devices with the corresponding certs inside de database
 *      produces:
 *        - application/json
 *      parameters:
 *        - name: id
 *          description: the device id which is bundle to the certificate
 *          in : body
 *          required : true
 *          schema:
 *            type: integer
 *        - name: password
 *          description: the password of the user to validate
 *          in : body
 *          required : true
 *          schema:
 *            type: integer
 *      responses:
 *        200:
 *          description: return the passphrase of the certificate
 *        401:
 *          description: unauthorized, the certificate is missing or wrong
 *        404:
 *          description: value asked not found
 */
router.post('/device/certificate/passphrase', function (req, res) {
    if(!req.body.password) {
        res.respond("Unauthorized : No password provided", 401);
        return;
    }
    var u = {id : req.user.id, password : req.body.password};
    red_users.verifyByID(u, function (err, status) {
        if(err) {
            console.log(err);
            res.respond("Internal server error", 500);
            return;
        }
        if(status) {
            devices.getCertificateKey({id: req.body.id, owner: req.user.id}, function (err, result) {
                if(err) {
                    console.log(err);
                    res.respond("Internal server error", 500);
                    return; 
                }
                if(result) {
                    res.respond(result.certificate);
                } else {
                    res.respond("You don't own the object", 404);
                    return;
                }
            });
        } else {
            res.respond("Password mismatch", 401);
        }
    });
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
 *          description: The acknowlegment of the number of certificates created
 *        401:
 *          description: unauthorized, the certificate is missing or wrong
 *        404:
 *          description: value asked not found
 */
router.get('/device/new/:nb', function (req, res) {

    // Set some absolute path
    certs.setCA(path.join(__dirname, '../CERTS/CA/ca.pem'), path.join(__dirname, '../CERTS/CA/ca.key'), "Ek12Bb@.");
    certs.setCertsFolder(path.join(__dirname, '../CERTS/DEVICES'));

    // Generate the certs
    certs.generateCertificates(req.params.nb, function () {

        // create devices inside the database
        certs.createDevices(function (err, d) {
            var nb = 0;
            // Insert in the database
            async.each(d, function (device, callback) {
                devices.insertDeviceWithCert(device.path, device.passphrase, device.fingerprint, req.user.id, function (err, results) {
                    if (!err) {
                        red_users.addDevice(results.toString(), req.user.id, function (err, result) {
                            if (!err) {
                                nb++;
                            } else console.log(err);
                            callback();
                        });
                    } else console.log(err);
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
router.post('/device', function (req, res) {
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
 *        404:
 *          description: could not load the data
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
router.post('/permissions/new', function (req, res) {
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
router.post('/permissions/update', function (req, res) {
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
router.get('/permissions/pending', function (req, res) {
    //admin can see which permissions requests have a pending status.
});

module.exports = router;
