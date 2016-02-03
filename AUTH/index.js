var x509 = require('x509');
var db = require('../DB/connect.js');


// Get all informations about certificates and then add it to the parse req object
module.exports.certAuthenticate = function ( req, res, next ) {
	// get the flag for CA verified connection
	/*if(req.headers['x-ssl-verify']) {
		req.client.sslVerify = true;	// set the flag to request client object
		var cert = req.headers['x-ssl-cert'] || undefined;	// Get the certificate
		if(cert != undefined) {
			cert = x509.parseCert(cert);	// Parse the certificate and then add it to the client object
			req.client.sslCert = cert;
		}
	} else {	// Not allowed, no informations about it
		req.client.sslVerify = false;
		req.client.sslCert = undefined;
	}*/
	next();
}


// Verify in the database if the certificate fingerprint match an entry
module.exports.ensureCertAuthenticated = function ( req, res, next ) {
	/*if( req.client.sslVerify === true && req.client.sslCert != undefined) {
		db.collection('device').findOne({ fingerprint: req.client.sslCert.fingerprint }, function (err, results) {
	        if (results != null) {
	            console.log("One device found ! \n\n" + results);
	        	next();
	        } else {
	           	console.log("The device does not exist ! \n\n" +err);
	        	res.send(401, "No Device Found");
	    });
	}*/
    
    next();
}