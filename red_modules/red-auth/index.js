var pem = require('pem');
var util = require('util');
var red_users = require('../red-users');
var red_devices = require('../red-devices');
require('../../routes/response.js');

var mongo = require('mongoskin');
var db = mongo.db('mongodb://localhost/RED_DB');


/**
 * Usage: 
 *   authentications using certificates and token
 *   app.use('/device', deviceAuthenticated);
 *   app.use('/user', tokenAuthenticated);
 */


/**@namespace */
var auth = {


    /**
     * Function that encapsulates all the device authentication process
     * Middleware for Express
     * @param {object} req The req object of express framework, see express.js website for more informations
     * @param {object} res The res object of express framework, see express.js website for more informations
     * @param {object} next callback used to call the next express middleware
     */
    deviceAuthenticated : function (req, res, next) {
        auth.certAuthenticated(req, res, function() {
            auth.tokenDeviceAuthorized(req, res, next);
        });
    },

    /** 
     * authenticate the device using certificate and then add it to the req object
     * @param {object} req The req object of express framework, see express.js website for more informations
     * @param {object} res The res object of express framework, see express.js website for more informations
     * @param {object} next callback used to call the next express middleware
     */
    certAuthenticated: function (req, res, next) {
        // get the flag for CA verified connection
        req.device = {
            id: null,
            authorized : false
        };
        req.ssl = {};
        
        //verify ssl
        if (req.headers['x-ssl-verify'] == "SUCCESS") {	// The cert was verified by the CA
            req.ssl.verified = true;
        } else if (req.headers['x-ssl-cert'] == "NONE") {	// The cert is not signed by our CA or has expired
            req.ssl.verified = false;
        } else {	// No other possibilities, but in case ....
            req.ssl.verified = false;
        }
        
        //get fingerprint
        if (req.headers['x-ssl-cert']) {
            var cert = req.headers['x-ssl-cert'].replace(/\t/g, '\n');	// Replace some non-desired caracters
            pem.getFingerprint(cert, function (error, f) {
                req.ssl.fingerprint = f.fingerprint; //retrieve fingerprint
                // If the client certificate is valid and is found (i.e header is set and fingerprint is not null)
                if (req.ssl.verified === true && req.ssl.fingerprint) {		
                    db.collection('device').findOne({ "certificate.fingerprint": req.ssl.fingerprint }, function (err, results) {	// Check inside the database
                        if (results != null) {
                            console.log("Device : " + results._id.toString() + " initiate a connection ....");		// Authentication complete the id is pass for other middlewares
                            req.device.id = results._id.toString();
                            next();
                        } else {
                            console.log("The device that initiate the connection doesn't exist !\nErrors : " + err);		// Authentication failed the cert is not ine the database
                            res.respond("Unauthorized : No Device Found in the database", 404);
                            //next();
                        }
                    });
                } else {
                    console.log("ssl is not verified or fingerprint is empty");
                    res.respond("Unauthorized : Certificate not valid", 401);
                    //next();
                }
            });
        } else {
            console.log("header x-ssl-cert not correct");
            res.respond("Unauthorized : No Certificate", 401);
            //next();
        }
    },

    /** 
     * Authorize the device with it's token, if the token is not valid before the expiration date occur, the device might be corrupted
     * If the device is not authorized, a new token will be issued
     * @param {object} req The req object of express framework, see express.js website for more informations
     * @param {object} res The res object of express framework, see express.js website for more informations
     * @param {object} next callback used to call the next express middleware
     */
    tokenDeviceAuthorized: function (req, res, next) {

        var bearerHeader = req.headers["authorization"];

        if (typeof bearerHeader !== 'undefined') {

            var bearerToken  = bearerHeader.split(" ")[1];
            if(!bearerToken) bearerToken = "";

            if (req.device.id) {
                // Detect for corrupted object here
                red_devices.validateToken( req.device.id, bearerToken, function (err, result) {
                    //result is ok, device is authorized
                    console.log(err);
                    if (result == true) {
                        console.log("device authorized " + req.device.id);
                        req.device.authorized = true;
                        next();
                    } else {
                        // Token outdated, need to register a new one (maybe a corrupted hardware)
                        console.log("Device Unauthorized : " + req.device.id + " Register for a new token ...");
                        req.device.authorized = false;
                        // register a new token
                        red_devices.register(req.device.id, req.ssl.fingerprint, function (err, token) {
                            if(err) {
                                // Error while registering, not authorized
                                res.respond("Unauthorized : cannot register a new token", 401);
                            } else {
                                // Process complete, normal response with the newly created token
                                res.respond({token : token, message : "Unauthorized : invalid token"}, 401);
                            }
                        });
                    }
                });
            }
            else {
                //header authorization is present but no token
                console.log('No device id found');
                res.respond('Unauthorized : No device ID provided', 401);
                //next();
            }
        }
        else {
            //no header authorization in request 
            console.log('no bearer header provided');
            res.respond("Unauthorized : No bearer auth provided", 401);
            //next();
        }
    },
    
    /** 
     * authenticate the user using token in request header and then add it to the req object
     * @param {object} req The req object of express framework, see express.js website for more informations
     * @param {object} res The res object of express framework, see express.js website for more informations
     * @param {object} next callback used to call the next express middleware
     */
    tokenAuthenticated: function (req, res, next) {

        req.user = {
            token: null,
            id: null,
        }
        var bearerToken;
        var bearerHeader = req.headers["authorization"];

        if (typeof bearerHeader !== 'undefined') {
            var bearer = bearerHeader.split(" ");
            bearerToken = bearer[1];

            if (bearerToken != null) {
                red_users.validateToken(bearerToken, function (err, result) {
                    //result is ok, user is authenticated and we store the cookie
                    if (result) {
                        console.log("user authenticated!");
                        
                        //find user id with the token
                        red_users.findByToken(bearerToken, function (err, result) {
                            if (err) {
                                console.log(err);
                            } else {
                                req.user.id = result.toString();
                                req.user.authenticated = true;
                                
                            }
                            next();
                        });
                    }
                    else if (err.message == "outdatedtoken") {
                        //token outdated, need to ask for another token (see with emre)
                        console.log("outdated token");
                        req.user.outdatedToken = true;
                        next();

                    }
                    else if (err.message == "tokenunmatcherror") {
                        //else if token does not exist, do nothing, the user is not authenticated
                        console.log("token num match error");
                        next();
                    }
                });
            }
            else {
                //header authorization is present but no token
                console.log('no token in header');
                next();
            }
        }
        else {
            //no header authorization in request 
            console.log('no token header provided');
            next();
        }
    },


    
    
    /** 
     * last middleware that check if one of the previous middleware worked
     * @param {object} req The req object of express framework, see express.js website for more informations
     * @param {object} res The res object of express framework, see express.js website for more informations
     * @param {object} next callback used to call the next express middleware
     */
    gateway: function (req, res, next) {
        if (req.user.token != null && req.device.id != null) { //check if there is a token AND a certificate, not possible
            console.log("error, should not be authenticated as a device AND a user");
            res.status(404).send({ error: "can't have a certificate AND a token " });
        } else if (req.user.token != null || req.device.id != null) { //if there is one authentication, go on to the next middleware
            next();
        } else if (req.user.outdatedToken) { //if token outdated
            res.status(401).send({error: "outdated token"})
        } else if (req.user.token == null && req.device.id == null) { //if no token or certificate
            res.status(401).send({ error: 'no token or certificate' });
        } else {
            res.status(401).send({ error: 'authentication error' });
        }
    }


}

module.exports = auth;