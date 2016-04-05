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


/**
*  @swagger
*  /user/info:
*    get:
*      tags: [Users]
*      description: Get the user informations like username, email
*      produces:
*        - application/json
*      parameters:
*       
*      responses:
*
*        ' 200':
*           description: Return some informations about the user
*           schema:
*               type: object
*               properties : 
*                   username : 
*                        type: string
*                        description: Username of the user
*                   mail : 
*                        type: string
*                        description: mail of the user
*        ' 401':
*           description: You don't provide any valid Bearer Token
*           schema:
*               type: object
*               properties : 
*                   code : 
*                       type: string
*                       description: HTTP code for the request (401)
*                   status : 
*                       type: string
*                       description: Status corresponding to the code (Unauthorized)
*                   message : 
*                       type: string
*                       description: Custom message from the API
*        ' 404':
*           description: Cannot get the infos for the user
*           schema:
*               type: object
*               properties : 
*                   code : 
*                       type: string
*                       description: HTTP code for the request (404)
*                   status : 
*                       type: string
*                       description: Status corresponding to the code (Not Found)
*                   message : 
*                       type: string
*                       description: Custom message from the API
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
*      parameters:
*       
*      responses:
*
*        ' 200':
*           description: Return the list of softwares
*           schema:
*               type: object
*               properties : 
*                   _id : 
*                        type: string
*                        description: id of the software
*                   name : 
*                        type: string
*                        description: current name of the software
*                   version : 
*                        type: string
*                        description: the version of the software (here the last one)
*                   description : 
*                        type: string
*                        description: the description of the software
*        ' 401':
*           description: You don't provide any valid Bearer Token
*           schema:
*               type: object
*               properties : 
*                   code : 
*                       type: string
*                       description: HTTP code for the request (401)
*                   status : 
*                       type: string
*                       description: Status corresponding to the code (Unauthorized)
*                   message : 
*                       type: string
*                       description: Custom message from the API
*        ' 404':
*           description: Cannot get the infos for the user
*           schema:
*               type: object
*               properties : 
*                   code : 
*                       type: string
*                       description: HTTP code for the request (404)
*                   status : 
*                       type: string
*                       description: Status corresponding to the code (Not Found)
*                   message : 
*                       type: string
*                       description: Custom message from the API
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
*      description: List all the softwares from a user with obsolete ones
*      produces:
*        - application/json
*      parameters:
*       
*      responses:
*
*        ' 200':
*           description: Return the list of softwares
*           schema:
*               type: object
*               properties : 
*                   _id : 
*                        type: string
*                        description: id of the software
*                   name : 
*                        type: string
*                        description: current name of the software
*                   version : 
*                        type: string
*                        description: the version of the software (here the last one)
*                   description : 
*                        type: string
*                        description: the description of the software
*                   obsolete : 
*                        type: boolean
*                        description: the current state of the software
*        ' 401':
*           description: You don't provide any valid Bearer Token
*           schema:
*               type: object
*               properties : 
*                   code : 
*                       type: string
*                       description: HTTP code for the request (401)
*                   status : 
*                       type: string
*                       description: Status corresponding to the code (Unauthorized)
*                   message : 
*                       type: string
*                       description: Custom message from the API
*        ' 404':
*           description: Cannot get the infos for the user
*           schema:
*               type: object
*               properties : 
*                   code : 
*                       type: string
*                       description: HTTP code for the request (404)
*                   status : 
*                       type: string
*                       description: Status corresponding to the code (Not Found)
*                   message : 
*                       type: string
*                       description: Custom message from the API
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
*      description: Return all the informations about one specific software
*      produces:
*        - application/json
*      parameters:
*        - name: id
*          description: ID of the software to find informations about
*          in : path
*          required : true
*          schema:
*              type: string
*       
*      responses:
*
*        ' 200':
*           description: Return the software properties
*           schema:
*               type: object
*               properties : 
*                   _id : 
*                        type: string
*                        description: id of the software
*                   name : 
*                        type: string
*                        description: current name of the software
*                   version : 
*                        type: string
*                        description: the version of the software (here the last one)
*                   description : 
*                        type: string
*                        description: the description of the software
*                   obsolete : 
*                        type: boolean
*                        description: the current state of the software
*        ' 401':
*           description: You don't provide any valid Bearer Token
*           schema:
*               type: object
*               properties : 
*                   code : 
*                       type: string
*                       description: HTTP code for the request (401)
*                   status : 
*                       type: string
*                       description: Status corresponding to the code (Unauthorized)
*                   message : 
*                       type: string
*                       description: Custom message from the API
*        ' 404':
*           description: Cannot get the infos for the user
*           schema:
*               type: object
*               properties : 
*                   code : 
*                       type: string
*                       description: HTTP code for the request (404)
*                   status : 
*                       type: string
*                       description: Status corresponding to the code (Not Found)
*                   message : 
*                       type: string
*                       description: Custom message from the API
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
*      description: Add or update a software in the database
*      produces:
*        - application/json
*      parameters:
*        - name: params
*          description: Software informations and linked .deb package file
*          in: body
*          required: true
*          schema: 
*               type: object
*               properties : 
*                   name : 
*                       type: string
*                       description: the name of the software
*                   version : 
*                       type: string
*                       description: the version of the software (5.2.3)
*                   description :
*                       type: string
*                       description: The description of the software (might be a short one)
*                   file :
*                       type: binary
*                       description: the .deb File to upload
*      responses:
*
*        ' 200':
*           description: Return only the HTTP code
*           schema:
*               type: object
*               properties : 
*                   code : 
*                       type: string
*                       description: HTTP code for the request (200)
*                   status : 
*                       type: string
*                       description: Status corresponding to the code (Created)
*                   message : 
*                       type: string
*                       description: Custom message from the API
*        ' 401':
*           description: You don't provide any valid Bearer Token
*           schema:
*               type: object
*               properties : 
*                   code : 
*                       type: string
*                       description: HTTP code for the request (401)
*                   status : 
*                       type: string
*                       description: Status corresponding to the code (Unauthorized)
*                   message : 
*                       type: string
*                       description: Custom message from the API
*        ' 404':
*           description: Cannot get the infos for the user
*           schema:
*               type: object
*               properties : 
*                   code : 
*                       type: string
*                       description: HTTP code for the request (404)
*                   status : 
*                       type: string
*                       description: Status corresponding to the code (Not Found)
*                   message : 
*                       type: string
*                       description: Custom message from the API
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
                } else {
                    res.respond("file uploaded and stored");
                }
            });
        });
    });
});

/**
*  @swagger
*  /user/device/add:
*    post:
*      tags: [Users]
*      description: Add a specific device to the set of the connected user (require some permissions before)
*      produces:
*        - application/json
*      parameters:
*        - name: params
*          description: ID of the device to add in the set
*          in: body
*          required: true
*          schema: 
*               type: object
*               properties : 
*                   id : 
*                       type: string
*                       description: The ID of the device to add in the set
*      responses:
*
*        ' 200':
*           description: Return only the HTTP code
*           schema:
*               type: object
*               properties : 
*                   code : 
*                       type: string
*                       description: HTTP code for the request (200)
*                   status : 
*                       type: string
*                       description: Status corresponding to the code (Created)
*                   message : 
*                       type: string
*                       description: Custom message from the API
*        ' 401':
*           description: You don't provide any valid Bearer Token
*           schema:
*               type: object
*               properties : 
*                   code : 
*                       type: string
*                       description: HTTP code for the request (401)
*                   status : 
*                       type: string
*                       description: Status corresponding to the code (Unauthorized)
*                   message : 
*                       type: string
*                       description: Custom message from the API
*        ' 404':
*           description: Cannot get the infos for the user
*           schema:
*               type: object
*               properties : 
*                   code : 
*                       type: string
*                       description: HTTP code for the request (404)
*                   status : 
*                       type: string
*                       description: Status corresponding to the code (Not Found)
*                   message : 
*                       type: string
*                       description: Custom message from the API
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
*      description: List all the devices from one user and retrieve their associated data
*      produces:
*        - application/json
*      parameters:
*
*      responses:
*
*        ' 200':
*           description: Return a list of devices data, which is a list of key:value pair
*           schema:
*               type: object
*               properties : 
*                   datatype : 
*                        type: string
*                        description: The key to retrive the data
*                   value : 
*                        type: string
*                        description: current value of the data in the store
*                   date : 
*                        type: string
*                        description: timestamp of the record
*        ' 401':
*           description: You don't provide any valid Bearer Token
*           schema:
*               type: object
*               properties : 
*                   code : 
*                       type: string
*                       description: HTTP code for the request (401)
*                   status : 
*                       type: string
*                       description: Status corresponding to the code (Unauthorized)
*                   message : 
*                       type: string
*                       description: Custom message from the API
*        ' 404':
*           description: Cannot get the infos for the user
*           schema:
*               type: object
*               properties : 
*                   code : 
*                       type: string
*                       description: HTTP code for the request (404)
*                   status : 
*                       type: string
*                       description: Status corresponding to the code (Not Found)
*                   message : 
*                       type: string
*                       description: Custom message from the API
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
*      description: Get the list of devices owned by a user
*      produces:
*        - application/json
*      parameters:
*
*      responses:
*
*        ' 200':
*           description: Return a list of devices ID
*           schema:
*               type: array
*               items : 
*                   _id : 
*                        type: string
*                        description: MongoDB ID of the devices
*        ' 401':
*           description: You don't provide any valid Bearer Token
*           schema:
*               type: object
*               properties : 
*                   code : 
*                       type: string
*                       description: HTTP code for the request (401)
*                   status : 
*                       type: string
*                       description: Status corresponding to the code (Unauthorized)
*                   message : 
*                       type: string
*                       description: Custom message from the API
*        ' 404':
*           description: Cannot get the infos for the user
*           schema:
*               type: object
*               properties : 
*                   code : 
*                       type: string
*                       description: HTTP code for the request (404)
*                   status : 
*                       type: string
*                       description: Status corresponding to the code (Not Found)
*                   message : 
*                       type: string
*                       description: Custom message from the API
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
*      description: Get data stored for the device given its ID
*      produces:
*        - application/json
*      parameters:
*        - name: id
*          description: MongoDB ID of the device to ask for its data
*          in : path
*          required : true
*          schema:
*            type: string
*
*      responses:
*
*        ' 200':
*           description: Return an array containing all data information stored for a device. Each information is indexed by its datatype
*           schema:
*               type: object
*               properties : 
*                   value : 
*                        type: string
*                        description: value of each record
*                   date : 
*                        type: string
*                        description: timestamp of each record
*        ' 401':
*           description: You don't provide any valid Bearer Token
*           schema:
*               type: object
*               properties : 
*                   code : 
*                       type: string
*                       description: HTTP code for the request (401)
*                   status : 
*                       type: string
*                       description: Status corresponding to the code (Unauthorized)
*                   message : 
*                       type: string
*                       description: Custom message from the API
*        ' 403':
*           description: Unauthorized to access the data (not enough permissions)
*           schema:
*               type: object
*               properties : 
*                   code : 
*                       type: string
*                       description: HTTP code for the request (403)
*                   status : 
*                       type: string
*                       description: Status corresponding to the code (Forbidden)
*                   message : 
*                       type: string
*                       description: Custom message from the API
*        ' 404':
*           description: Cannot get the infos for the user
*           schema:
*               type: object
*               properties : 
*                   code : 
*                       type: string
*                       description: HTTP code for the request (404)
*                   status : 
*                       type: string
*                       description: Status corresponding to the code (Not Found)
*                   message : 
*                       type: string
*                       description: Custom message from the API
*/
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
*  /user/device/summary/{id}:
*    get:
*      tags: [Users]
*      description: Get a summary for a device short description
*      produces:
*        - application/json
*      parameters:
*        - name: id
*          description: MongoDB ID of the device to ask for its summary
*          in : path
*          required : true
*          schema:
*            type: string
*
*      responses:
*
*        ' 200':
*           description: Return an object containing all the relevant information about the device
*           schema:
*               type: object
*               properties : 
*                   _id : 
*                        type: string
*                        description: MongoDB ID of the device
*                   name : 
*                        type: string
*                        description: common name of the device
*                   description : 
*                        type: string
*                        description: short description of the device
*                   creationDate : 
*                        type: string
*                        description: timestamp of creation of the device
*                   installedVersionRED : 
*                        type: string
*                        description: version installed of RED library
*                   softwarelist : 
*                        type: string
*                        description: list of MongoDB ID of softwares installed
*                   users : 
*                        type: string
*                        description: number of users that own the device
*                   permissions:
*                       type: string
*                       description: number of permissions on this device
*        ' 401':
*           description: You don't provide any valid Bearer Token
*           schema:
*               type: object
*               properties : 
*                   code : 
*                       type: string
*                       description: HTTP code for the request (401)
*                   status : 
*                       type: string
*                       description: Status corresponding to the code (Unauthorized)
*                   message : 
*                       type: string
*                       description: Custom message from the API
*        ' 403':
*           description: Unauthorized to access the data (not enough permissions)
*           schema:
*               type: object
*               properties : 
*                   code : 
*                       type: string
*                       description: HTTP code for the request (403)
*                   status : 
*                       type: string
*                       description: Status corresponding to the code (Forbidden)
*                   message : 
*                       type: string
*                       description: Custom message from the API
*        ' 404':
*           description: Cannot get the infos for the user
*           schema:
*               type: object
*               properties : 
*                   code : 
*                       type: string
*                       description: HTTP code for the request (404)
*                   status : 
*                       type: string
*                       description: Status corresponding to the code (Not Found)
*                   message : 
*                       type: string
*                       description: Custom message from the API
*/
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
*  /user/device/certificate/{id}:
*    get:
*      tags: [Users]
*      description: Return the certificate file for that object (need permissions) as attachment
*      produces:
*        - application/json
*      parameters:
*        - name: id
*          description: The device ID to get its certificate file
*          in : path
*          required : true
*          schema:
*            type: string
*
*      responses:
*
*        ' 200':
*           description: Return the certificate file for that object (need permissions) as attachment
*           schema:
*               type: binary
*        ' 401':
*           description: You don't provide any valid Bearer Token
*           schema:
*               type: object
*               properties : 
*                   code : 
*                       type: string
*                       description: HTTP code for the request (401)
*                   status : 
*                       type: string
*                       description: Status corresponding to the code (Unauthorized)
*                   message : 
*                       type: string
*                       description: Custom message from the API
*        ' 403':
*           description: Cannot get the certificate, access forbidden
*           schema:
*               type: object
*               properties : 
*                   code : 
*                       type: string
*                       description: HTTP code for the request (403)
*                   status : 
*                       type: string
*                       description: Status corresponding to the code (Forbidden)
*                   message : 
*                       type: string
*                       description: Custom message from the API
*        ' 500':
*           description: Internal server error, errors occured during the process
*           schema:
*               type: object
*               properties : 
*                   code : 
*                       type: string
*                       description: HTTP code for the request (500)
*                   status : 
*                       type: string
*                       description: Status corresponding to the code (Internal Server Error)
*                   message : 
*                       type: string
*                       description: Custom message from the API
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
            res.respond("You don't own the device", 403);
            return;
        }
    });
});



/**
*  @swagger
*  /user/device/certificate/passphrase:
*    post:
*      tags: [Users]
*      description: Return the passphrase for the certificate
*      produces:
*        - application/json
*      parameters:
*        - name: id
*          description: the device ID which is bundle to the certificate
*          in : body
*          required : true
*          schema:
*            type: string
*        - name: password
*          description: the password of the user to validate
*          in : body
*          required : true
*          schema:
*            type: string
*
*      responses:
*
*        ' 200':
*           description: return the passphrase in plain text
*           schema:
*               type: object
*               properties : 
*                   passphrase : 
*                       type: string
*                       description: The passphrase in plain text format
*        ' 401':
*           description: You don't provide any valid Bearer Token
*           schema:
*               type: object
*               properties : 
*                   code : 
*                       type: string
*                       description: HTTP code for the request (401)
*                   status : 
*                       type: string
*                       description: Status corresponding to the code (Unauthorized)
*                   message : 
*                       type: string
*                       description: Custom message from the API
*        ' 403':
*           description: Cannot get the passphrase, access forbidden
*           schema:
*               type: object
*               properties : 
*                   code : 
*                       type: string
*                       description: HTTP code for the request (403)
*                   status : 
*                       type: string
*                       description: Status corresponding to the code (Forbidden)
*                   message : 
*                       type: string
*                       description: Custom message from the API
*        ' 500':
*           description: Internal server error, errors occured during the process
*           schema:
*               type: object
*               properties : 
*                   code : 
*                       type: string
*                       description: HTTP code for the request (500)
*                   status : 
*                       type: string
*                       description: Status corresponding to the code (Internal Server Error)
*                   message : 
*                       type: string
*                       description: Custom message from the API
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
                    res.respond("You don't own the object", 403);
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
*      description: Create a certain amount of new devices for the connected user
*      produces:
*        - application/json
*      parameters:
*        - name: nb
*          description: The number of certificates and devices to create
*          in : path
*          required : true
*          schema:
*            type: string
*
*      responses:
*
*        ' 200':
*           description: return the number of created devices in the message
*           schema:
*               type: object
*               properties : 
*                   code : 
*                       type: string
*                       description: HTTP code for the request (200)
*                   status : 
*                       type: string
*                       description: Status corresponding to the code (Created)
*                   message : 
*                       type: string
*                       description: Custom message from the API
*        ' 401':
*           description: You don't provide any valid Bearer Token
*           schema:
*               type: object
*               properties : 
*                   code : 
*                       type: string
*                       description: HTTP code for the request (401)
*                   status : 
*                       type: string
*                       description: Status corresponding to the code (Unauthorized)
*                   message : 
*                       type: string
*                       description: Custom message from the API
*        ' 500':
*           description: Internal server error, errors occured during the process
*           schema:
*               type: object
*               properties : 
*                   code : 
*                       type: string
*                       description: HTTP code for the request (500)
*                   status : 
*                       type: string
*                       description: Status corresponding to the code (Internal Server Error)
*                   message : 
*                       type: string
*                       description: Custom message from the API
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

/**
*  @swagger
*  /user/device:
*    post:
*      tags: [Users]
*      description: Post some data to the device (deprecated)
*      produces:
*        - application/json
*      parameters:
*        - name: params
*          description: id of the object to push data, and the corresponding key:value pair plus the date
*          in: body
*          required: true
*          schema:
*               type: object
*               properties:
*                   id: 
*                       type: string
*                       description: the MongoDB ID of the device in which to push data
*                   datatype: 
*                       type: string
*                       description: the key representing the actual data
*                   value:  
*                       type: string
*                       description: the current value of the data passed
*                   date: 
*                       type: string
*                       description: the timestamp for the record of the value
*        
*      responses:
*
*        ' 200':
*           description: return the http status only
*           schema:
*               type: object
*               properties : 
*                   code : 
*                       type: string
*                       description: HTTP code for the request (200)
*                   status : 
*                       type: string
*                       description: Status corresponding to the code (Created)
*                   message : 
*                       type: string
*                       description: Custom message from the API
*        ' 401':
*           description: You don't provide any valid Bearer Token
*           schema:
*               type: object
*               properties : 
*                   code : 
*                       type: string
*                       description: HTTP code for the request (401)
*                   status : 
*                       type: string
*                       description: Status corresponding to the code (Unauthorized)
*                   message : 
*                       type: string
*                       description: Custom message from the API
*        ' 500':
*           description: Internal server error, errors occured during the process
*           schema:
*               type: object
*               properties : 
*                   code : 
*                       type: string
*                       description: HTTP code for the request (500)
*                   status : 
*                       type: string
*                       description: Status corresponding to the code (Internal Server Error)
*                   message : 
*                       type: string
*                       description: Custom message from the API
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
