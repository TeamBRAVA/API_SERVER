var pem = require('pem');
var util = require('util');

var mongo = require('mongoskin');
var db = mongo.db('mongodb://localhost/RED_DB');

/**
 * @fileOverview certificate authentication functions.
 * @author <a href="mailto:berthaud@edu.ece.fr">Thomas Berthaud</a>
 * @version 1.0.0
 */

/**@namespace */
var certAuth = {

    /** 
     * Get all informations about certificates and then add it to the parse req object
     * @param {object} req The req object of express framework, see express.js website for more informations
     * @param {object} res The res object of express framework, see express.js website for more informations
     * @param {object} next callback used to call the next express middleware
     */
    certAuthenticate: function (req, res, next) {
        // get the flag for CA verified connection
        req.device = {};
        req.device.ssl = {};

        if (req.headers['x-ssl-verify'] == "SUCCESS") {	// The cert was verified by the CA
            req.device.ssl.verified = true;
        } else if (req.headers['x-ssl-cert'] == "NONE") {	// The cert is not signed by our CA or has expired
            req.device.ssl.verified = false;
        } else {	// No other possibilities, but in case ....
            req.device.ssl.verified = false;
        }
        if (req.headers['x-ssl-cert']) {
            var cert = req.headers['x-ssl-cert'].replace(/\t/g, '\n');	// Replace some non-desired caracters
            pem.getFingerprint(cert, function (error, f) {
                req.device.ssl.fingerprint = f.fingerprint;
                next();
            });
        } else {
            req.device.ssl.fingerprint = null;
            next();
        }
    },

    /** 
     * Verify in the database if the certificate fingerprint match an entry
     * @param {object} req The req object of express framework, see express.js website for more informations
     * @param {object} res The res object of express framework, see express.js website for more informations
     * @param {object} next callback used to call the next express middleware
     */
    ensureCertAuthenticated: function (req, res, next) {
        if (req.device.ssl.verified === true && req.device.ssl.fingerprint) {		// If the client certificate is valid and is found
            db.collection('device').findOne({ "certificate.fingerprint": req.device.ssl.fingerprint }, function (err, results) {	// Check inside the database
                if (results != null) {
                    console.log("Device : " + results._id.toString() + " initiate a connection ....");		// Authentication complete the id is pass for other middlewares
                    req.device.id = results._id.toString();
                    next();
                } else {
                    console.log("The device that initiate the connection doesn't exist !\nErrors : " + err);		// Authentication failed the cert is not ine the database
                    res.status(401).send("No Device Found in the Database");
                }
            });
        } else {
            res.status(401).send("Unauthorized");
        }
    }
}

module.exports = certAuth;