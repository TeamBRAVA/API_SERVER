var x509 = require('x509');
var db = require('../DB/connect.js');
var util = require('util');

// Get all informations about certificates and then add it to the parse req object
module.exports.certAuthenticate = function ( req, res, next ) {
	// get the flag for CA verified connection
	req.device = {};
	req.device.ssl = {};
	if(req.headers['x-ssl-verify']) {
		req.device.ssl.verified = true;	// set the flag to request client object
		var cert = req.headers['x-ssl-cert'] || undefined;	// Get the certificate
		if(cert != undefined) {
			cert = cert.replace(/\t/g, '\n');	// Replace some non-desired caracters
			cert = x509.parseCert(cert);	// Parse the certificate and then add it to the client object
			req.device.ssl.certificate = cert;
		}
	} else {	// Not allowed, no informations about it
		req.device.ssl.verified = false;
		req.device.ssl.certificate = undefined;
	}
	next();
}


// Verify in the database if the certificate fingerprint match an entry
module.exports.ensureCertAuthenticated = function ( req, res, next ) {
	if( req.device.ssl.verified === true && req.device.ssl.certificate != undefined) {		// If the client certificate is valid and is found
		db.collection('device').findOne({ fingerprint: req.device.ssl.certificate.fingerPrint }, function (err, results) {	// Check inside the database
	        if (results != null) {
	            console.log("Device : " + results._id + " initiate a connection ....");		// Authentication complete the id is pass for other middlewares
	            req.device.id = results._id;
	        	next();
	        } else {
	           	console.log("The device that initiate the connection doesn't exist ! \n\n" + err);		// Authentication failed the cert is not ine the database
	        	res.status(401).send("No Device Found in the Database");
	        }
	    });
	} else {
		res.status(401).send("Unauthorized");
	}
}