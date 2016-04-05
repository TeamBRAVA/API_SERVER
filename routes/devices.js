var express = require('express');
var router = express.Router();
var path = require('path');
var async = require('async');
require('./response');

var devices = require('../red_modules/red-devices');
var certs = require('../red_modules/red-cert-generator');
var perm = require('../red_modules/red-permissions');
var red_users = require('../red_modules/red-users');
var soft = require('../red_modules/red-repository');

/*API FOR THE DEVICES AND THEIR PERMISSIONS */


////////////////////////////////////////////////////////////////////////////////
/*dev code (TO DELETE)*/

/**
*/
////////////NOTWORKING  :: get only one device ? 
router.get('/result', function(req, res) {
    devices.find(req.device.id, function(err, result) {
        if (err) return console.error(err);
        res.respond(result);
    });
});


/**
*
*/
// Get results from other devices (by id)

////////////WORKING
router.get('/result/:id', function(req, res) {
    devices.find(req.params.id, function(err, result) {
        if (err) return console.error(err);
        res.respond(result);
    });
});
/////////////////////////////////////////////////////////////////////////////////////



/**
*  @swagger
*  /device/update:
*    get:
*      tags: [Devices]
*      description: Get the last version of the library
*      produces:
*        - application/json
*      responses:
*
*        ' 200':
*           description: return the list of softwares that need to be updated, with their corresponding IDs
*           schema:
*               type: object
*               properties : 
*                   _id : 
*                       type: string
*                       description: MongDB ID
*                   name : 
*                       type: string
*                       description: name of the software as in MongoDB
*                   version : 
*                        type: string
*                        description: version of the software as in MongoDB
*        ' 401':
*           description: unauthorized, the certificate is missing, wrong or you didn't provide any Bearer Token
*           schema:
*               type: object
*               properties : 
*                   code : 
*                       type: string
*                       description: HTTP code for the request (401)
*                   status : 
*                       type: string
*                       description: Status corresponding to the code (unauthorized)
*                   message : 
*                       type: string
*                       description: Custom message from the API
*        ' 404':
*           description: Not Found on the server (maybe wrong parameters) should never appear
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
router.get('/update', function(req, res) {
    console.log("device ID : " + req.device.id);
    devices.softwares(req.device.id, function (err, result) {
        if(err) {
            res.respond("Internal server error", 500);
            return;
        }
        soft.createList(result, function (list) {
            res.respond(list);
        });
    });
});

/**
*  @swagger
*  /device/update/{id}:
*    get:
*      tags: [Devices]
*      description: Download the specified software. It check if the device has all the rights to do it
*      produces:
*         - application/octet-stream
*      parameters:
*         - name: id
*           description: ID of the device, previously getted with /device/update
*           in : path
*           required : true
*           schema:
*               type: string
*      responses:
*
*        ' 200':
*           description: Return the corresponding .deb file. Before download, the server verify the authenticity of the request
*           schema:
*               type: file
*        ' 401':
*           description: unauthorized, the certificate is missing, wrong or you didn't provide any Bearer Token
*           schema:
*               type: object
*               properties : 
*                   code : 
*                       type: string
*                       description: HTTP code for the request (401)
*                   status : 
*                       type: string
*                       description: Status corresponding to the code (unauthorized)
*                   message : 
*                       type: string
*                       description: Custom message from the API
*        ' 404':
*           description: Not Found on the server (maybe wrong parameters) should never appear
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
router.get('/update/:id', function (req, res) {
    var id = req.params.id;
    devices.softwares(req.device.id, function (err, result) {
        soft.createIDList(result, function (list) {
            if(list.indexOf(id) != -1 || result.indexOf(id) != -1) {    // if the soft ID is in the list of the device
                soft.getPath(id, function (err, p) {
                    res.sendFile(p, {dotfiles : 'allow'}, function (err) {
                        if (err) {
                            console.log(err);
                            res.status(err.status).end();
                        } else {
                            console.log('Sent:', p);
                        }
                    });
                });
            }
        });
    });
});

/**
*  @swagger
*  /device/update/ack/{id}:
*    post:
*      tags: [Devices]
*      description:  Post data to the device itself
*      produces:
*         - application/json
*      parameters:
*         - name: id
*           description: ID of the software, previously getted with /device/update, the device successfully installed
*           in : path
*           required : true
*           schema:
*               type: string
*      responses:
*
*        ' 200':
*           description: Only the HTTP code, no other response
*           schema:
*               type: object
*               properties : 
*                   code : 
*                       type: string
*                       description: HTTP code for the request (200)
*                   status : 
*                       type: string
*                       description: Status corresponding to the code (created)
*        ' 401':
*           description: unauthorized, the certificate is missing, wrong or you didn't provide any Bearer Token
*           schema:
*               type: object
*               properties : 
*                   code : 
*                       type: string
*                       description: HTTP code for the request (401)
*                   status : 
*                       type: string
*                       description: Status corresponding to the code (unauthorized)
*                   message : 
*                       type: string
*                       description: Custom message from the API
*        ' 500':
*           description: An error occured during the process, the server return 500
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
router.post('/update/ack/:idsoft', function(req, res) {
    //Create the object containing fields to search for
    var device = {
        id: req.device.id,
        validateSoft: req.params.idsoft,
    }
    //we call devices data function that will take, the object, translate it into model object and then save it
    devices.validateNewSoftware(device, callback);

    //callback function
    function callback(err, result) {
        if (err) {
            console.log(err);
            res.respond("Cannot change the status of the update, retry later", 500);
        }
        else
            res.respond(true);
    }
});

/**
*  @swagger
*  /device/newdata:
*    post:
*      tags: [Devices]
*      description:  Post data to the device itself
*      produces:
*         - application/json
*      parameters:
*        - name : params
*          in : body
*          description: The data you want to send to the server
*          required: true
*          schema:
*            type: object
*            properties : 
*               datatype : 
*                  type: string
*                  description: the datatype key asked for
*               value : 
*                  type: string
*                  description: Status corresponding to the code (unauthorized)
*               date : 
*                  type: string
*                  description: recording timestamp of the sample
*      responses:
*
*        ' 200':
*           description: Return the value that you previously send in the request
*           schema:
*               type: object
*               properties : 
*                   datatype : 
*                       type: string
*                       description: the datatype key asked for
*                   value : 
*                       type: string
*                       description: Status corresponding to the code (unauthorized)
*                   date : 
*                       type: string
*                       description: recording timestamp of the sample
*        ' 401':
*           description: unauthorized, the certificate is missing, wrong or you didn't provide any Bearer Token
*           schema:
*               type: object
*               properties : 
*                   code : 
*                       type: string
*                       description: HTTP code for the request (401)
*                   status : 
*                       type: string
*                       description: Status corresponding to the code (unauthorized)
*                   message : 
*                       type: string
*                       description: Custom message from the API
*        ' 404':
*           description: Not Found on the server (maybe wrong parameters) should never appear
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
router.post('/newdata', function(req, res) {
    //Create the object containing fields to search for
    var device = {
        id: req.device.id,
        datatype: req.body.datatype,
        value: req.body.value,
    }
    //we call devices data function that will take, the object, translate it into model object and then save it
    devices.pushData(device, callback);

    //callback function
    function callback(err, result) {
        if (err) {
            console.log(err);
            res.respond("Data not found", 404);
        }
        else
            res.respond(result);
    }
});


/**
*  @swagger
*  /device/{datatype}:
*    get:
*      tags: [Devices]
*      description: Get the most recent value matching the datatype for the device itself
*      produces:
*         - application/json
*      parameters:
*        - name: datatype
*          description: Type of the data you request
*          in : path
*          required: true
*          schema:
*            type: string
*      responses:
*
*        ' 200':
*           description: Return the entry in the database corresponding to the datatype asked
*           schema:
*               type: object
*               properties : 
*                   datatype : 
*                       type: string
*                       description: the datatype key asked for
*                   value : 
*                       type: string
*                       description: Status corresponding to the code (unauthorized)
*                   date : 
*                       type: string
*                       description: recording timestamp of the sample
*        ' 401':
*           description: unauthorized, the certificate is missing, wrong or you didn't provide any Bearer Token
*           schema:
*               type: object
*               properties : 
*                   code : 
*                       type: string
*                       description: HTTP code for the request (401)
*                   status : 
*                       type: string
*                       description: Status corresponding to the code (unauthorized)
*                   message : 
*                       type: string
*                       description: Custom message from the API
*        ' 404':
*           description: Not Found on the server (maybe wrong parameters) should never appear
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
router.get('/:datatype', function(req, res) {
    //get from url which data we want
    var condition = {
        "id": req.device.id,
        "datatype": req.params.datatype
    };
    //call devices data function to retrieve asked data
    devices.pullDatatype(condition, callback);

    //callback function
    function callback(err, result) {
        if (err) {
            console.log(err);
            res.respond("Data not found", 404);
        }
        else
            res.respond(result);
    }
});

/**
*  @swagger
*  /device/{datatype}/{date}:
*    get:
*      tags: [Devices]
*      description: Get the last data marked with a specific date as a second argument
*      produces:
*         - application/json
*      parameters:
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
*      responses:
*
*        ' 200':
*           description: Return the entry in the database corresponding to the datatype and date asked
*           schema:
*               type: object
*               properties : 
*                   datatype : 
*                       type: string
*                       description: the datatype key asked for
*                   value : 
*                       type: string
*                       description: Status corresponding to the code (unauthorized)
*                   date : 
*                       type: string
*                       description: recording timestamp of the sample
*        ' 401':
*           description: unauthorized, the certificate is missing, wrong or you didn't provide any Bearer Token
*           schema:
*               type: object
*               properties : 
*                   code : 
*                       type: string
*                       description: HTTP code for the request (401)
*                   status : 
*                       type: string
*                       description: Status corresponding to the code (unauthorized)
*                   message : 
*                       type: string
*                       description: Custom message from the API
*        ' 404':
*           description: Not Found on the server (maybe wrong parameters) should never appear
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
router.get('/:datatype/:date', function(req, res) {
    //get from url which data we want
    var condition = {
        "id": req.device.id,
        "datatype": req.params.datatype,
        "date": req.params.date
    };
    //call devices data function to retrieve asked data
    devices.pullDatatypeAndDate(condition, callback);

    //callback function
    function callback(err, result) {
        if (err) {
            console.log(err);
            res.respond("Data not found", 404);
        }
        else
            res.respond(result);
    }
});


/**
*  @swagger
*  /device/other/{id}:
*    post:
*      tags: [Devices]
*      description:  Post data to an other device. You need to have the right permissions to handle this
*      produces:
*         - application/json
*      parameters:
*        - name: id
*          description: id of the device targeted doing the request
*          in : path
*          required : true
*          schema:
*            type: string
*        - name : params
*          in : body
*          description: The data you want to send
*          required: true
*          schema:
*            type: object
*            properties : 
*               datatype : 
*                  type: string
*                  description: the datatype key asked for
*               value : 
*                  type: string
*                  description: Status corresponding to the code (unauthorized)
*               date : 
*                  type: string
*                  description: recording timestamp of the sample
*      responses:
*
*        ' 200':
*           description: Return the value that you previously send in the request
*           schema:
*               type: object
*               properties : 
*                   datatype : 
*                       type: string
*                       description: the datatype key asked for
*                   value : 
*                       type: string
*                       description: Status corresponding to the code (unauthorized)
*                   date : 
*                       type: string
*                       description: recording timestamp of the sample
*        ' 401':
*           description: unauthorized, the certificate is missing, wrong or you didn't provide any Bearer Token
*           schema:
*               type: object
*               properties : 
*                   code : 
*                       type: string
*                       description: HTTP code for the request (401)
*                   status : 
*                       type: string
*                       description: Status corresponding to the code (unauthorized)
*                   message : 
*                       type: string
*                       description: Custom message from the API
*        ' 404':
*           description: Not Found on the server (maybe wrong parameters) should never appear
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
router.post('/other/:id', function(req, res) {
    //make sure the data can be written on a device
    var access = {};
    access[req.params.datatype] = "write";
    var from = { device: req.device.id };
    var to = { device: req.params.id };

    perm.verify(from, to, access, function(err, result) {
        if (err) {
            console.log(err);
            res.respond("Data not found", 500);
            return;
        }
        if (result == true) {
            //Create the object
            var device = {
                id: req.params.id,
                datatype: req.body.datatype,
                value: req.body.value,
            }
            //we call devices data function that will take, the object, translate it into model object and then save it
            devices.pushData(device, function(err, result) {
                if (err) {
                    console.log(err);
                    res.respond("Data not found", 404);
                } else
                    res.respond(result);
            });
        } else {
            res.respond("Unauthorized to access data", 403);    // Forbidden
        }

    });
});


/**
*  @swagger
*  /device/other/{id}/{datatype}:
*    get:
*      tags: [Devices]
*      description: Get the data that match the data type requested and its ID, in the last sample of data
*      produces:
*         - application/json
*      parameters:
*         - name: id
*           description: MongoDB ID of the device targeted doing the request
*           in : path
*           required : true
*           schema:
*             type: string
*         - name: datatype
*           description:
*           in : path
*           required: true
*           schema:
*             type: string
*      responses:
*
*        ' 200':
*           description: Return the entry in the database corresponding to the one asked
*           schema:
*               type: object
*               properties : 
*                   datatype : 
*                       type: string
*                       description: the datatype key asked for
*                   value : 
*                       type: string
*                       description: Status corresponding to the code (unauthorized)
*                   date : 
*                       type: string
*                       description: recording timestamp of the sample
*        ' 401':
*           description: unauthorized, the certificate is missing, wrong or you didn't provide any Bearer Token
*           schema:
*               type: object
*               properties : 
*                   code : 
*                       type: string
*                       description: HTTP code for the request (401)
*                   status : 
*                       type: string
*                       description: Status corresponding to the code (unauthorized)
*                   message : 
*                       type: string
*                       description: Custom message from the API
*        ' 404':
*           description: Not Found on the server (maybe wrong parameters) should never appear
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
router.get('/other/:id/:datatype', function(req, res) {
    //get from url which data we want
    var condition = {
        "id": req.params.id,
        "datatype": req.params.datatype
    };

    var access = {};
    access[req.params.datatype] = "read";
    var from = { device: req.device.id };
    var to = { device: req.params.id };

    perm.verify(from, to, access, function(err, result) {
        if (err) {
            console.log(err);
            res.respond("Data not found", 500);
            return;
        }
        if (result == true) {
            //call devices data function to retrieve asked data
            devices.pullDatatype(condition, function(err, result) {
                if (err) {
                    console.log(err);
                    res.respond("Data not found", 404);
                }
                else
                    res.respond(result);
            });
        } else {
            res.respond("Unauthorized to access data", 403);    // Forbidden
        }
    });

});


/**
*  @swagger
*  /device/other/{id}/{datatype}/{date}:
*    get:
*      tags: [Devices]
*      description:  Get the last data marked with a specific date as a second argument
*      produces:
*         - application/json
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
*      responses:
*
*        ' 200':
*           description: Return the entry in the database corresponding to the one asked
*           schema:
*               type: object
*               properties : 
*                   datatype : 
*                       type: string
*                       description: the datatype key asked for
*                   value : 
*                       type: string
*                       description: Status corresponding to the code (unauthorized)
*                   date : 
*                       type: string
*                       description: recording timestamp of the sample
*        ' 401':
*           description: unauthorized, the certificate is missing, wrong or you didn't provide any Bearer Token
*           schema:
*               type: object
*               properties : 
*                   code : 
*                       type: string
*                       description: HTTP code for the request (401)
*                   status : 
*                       type: string
*                       description: Status corresponding to the code (unauthorized)
*                   message : 
*                       type: string
*                       description: Custom message from the API
*        ' 404':
*           description: Not Found on the server (maybe wrong parameters) should never appear
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
router.get('/other/:id/:datatype/:date', function(req, res) {
    //Make sure the current device as the right to get the data
    var access = {};
    access[req.params.datatype] = "read";
    var from = { device: req.device.id };
    var to = { device: req.params.id };

    perm.verify(from, to, access, function(err, result) {
        if (err) {
            console.log(err);
            res.respond("Data not found", 500);
            return;
        }
        if (result == true) {
            //get from url which data we want
            var condition = {
                "id": req.params.id,
                "datatype": req.params.datatype,
                "date": req.params.date
            };
            //call devices data function to retrieve asked data
            devices.pullDatatypeAndDate(condition, function(err, result) {
                if (err) {
                    console.log(err);
                    res.respond("Data not found", 404);
                }
                else
                    res.respond(result);
            });

        } else {
            res.respond("Unauthorized to access data", 403);    // Forbidden
        }

    });
});



module.exports = router;
