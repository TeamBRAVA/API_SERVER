var pem = require('pem');
var util = require('util');
var red_users = require('../red-users');

var mongo = require('mongoskin');
var db = mongo.db('mongodb://localhost/RED_DB');


/**
 * Usage: 
 *   authentications using certificates and token
 *   app.use('/',certAuthenticated);
 *   app.use('/',tokenAuthenticated);
 *   app.use('/',doubleAuth);
 */


/**@namespace */
var auth = {

    /** 
     * authenticate the device using certificate and then add it to the req object
     * @param {object} req The req object of express framework, see express.js website for more informations
     * @param {object} res The res object of express framework, see express.js website for more informations
     * @param {object} next callback used to call the next express middleware
     */
    certAuthenticated: function (req, res, next) {
        // get the flag for CA verified connection
        req.device = {};
        req.device.ssl = {};
        req.device.authenticated = false;
        
        //verify ssl
        if (req.headers['x-ssl-verify'] == "SUCCESS") {	// The cert was verified by the CA
            req.device.ssl.verified = true;
        } else if (req.headers['x-ssl-cert'] == "NONE") {	// The cert is not signed by our CA or has expired
            req.device.ssl.verified = false;
        } else {	// No other possibilities, but in case ....
            req.device.ssl.verified = false;
        }
        
        //get fingerprint
        if (req.headers['x-ssl-cert']) {
            var cert = req.headers['x-ssl-cert'].replace(/\t/g, '\n');	// Replace some non-desired caracters
            pem.getFingerprint(cert, function (error, f) {
                req.device.ssl.fingerprint = f.fingerprint;
            });
        } else {
            req.device.ssl.fingerprint = null;
        }
        
        //check if fingerprint is ok
        if (req.device.ssl.verified === true && req.device.ssl.fingerprint) {		// If the client certificate is valid and is found
            db.collection('device').findOne({ "certificate.fingerprint": req.device.ssl.fingerprint }, function (err, results) {	// Check inside the database
                if (results != null) {
                    console.log("Device : " + results._id.toString() + " initiate a connection ....");		// Authentication complete the id is pass for other middlewares
                    req.device.id = results._id.toString();
                    req.device.authenticated = true;
                    
                } else {
                    console.log("The device that initiate the connection doesn't exist !\nErrors : " + err);		// Authentication failed the cert is not ine the database
                   
                }
            });
        } else {
            console.log("ssl is not verified or fingerprint is empty");
        }
        
        next();
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
            authenticated: false
        }
        var bearerToken;
        var bearerHeader = req.headers["authorization"];

        if (typeof bearerHeader !== 'undefined') {
            var bearer = bearerHeader.split(" ");
            bearerToken = bearer[1];
            console.log(bearerToken);

            if (bearerToken != null) {
                red_users.validateToken(bearerToken, function (err, result) {
                    //result is ok, user is authenticated and we store the cookie
                    if (result) {
                        console.log("user authenticated!");
                        req.user.token = bearerToken;
                        
                        //find user id with the token
                        red_users.findUserByToken(bearerToken, function (err, result) {
                            if (err) {
                                console.log(err);
                            } else {
                                req.user.id = result;
                                req.user.authenticated = true;
                            }
                        });
                    }
                    else if (err.message == "outdatedtoken") {
                        //token outdated, need to ask for another token (see with emre)
                        console.log("outdated token");
                        
                    }
                    else if (err.message == "tokenunmatcherror") {
                        //else if token does not exist, do nothing, the user is not authenticated
                        console.log("token num match error");
                    }
                    
                });
            }
            else {
                //header authorization is present but no token
                console.log('no token in header');
            }
        }
        else {
           //no header authorization in request 
           console.log('no token header provided');
        }
        
        next();
    },
    
    /** 
     * last middleware that check if one of the previous middleware worked
     * @param {object} req The req object of express framework, see express.js website for more informations
     * @param {object} res The res object of express framework, see express.js website for more informations
     * @param {object} next callback used to call the next express middleware
     */
    doubleAuth: function (req, res, next) {
        if (req.user.authenticated || req.device.authenticated) {
            next();
        } else if(!req.user.authenticated) {
            res.status(401).send({ message: 'wrong token' });
        } else if(!req.device.authenticated){
            res.status(401).send({ message: 'wrong certificate' });
        }
    }


}

module.exports = auth;