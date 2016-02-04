var child_process = require('child_process');
var util = require('util');
var fs = require('fs');
var path = require('path');
var x509 = require('x509');
var crypto = require('crypto');


var c = {
	pem : "",
	key : "",
	passphrase : "",
	certs : ""
};

// Set the CA key and pem file path, and the passphrase for the ca
exports.setCA = function ( pem, key, passphrase) {
	c.pem = pem;
	c.key = key;
	c.passphrase = passphrase;
}

// set absolute path for the end certificates folder
exports.setCertsFolder = function ( folder ) {
	c.certs = folder;
}

exports.generateCertificates = function(n, callback) {
	child_process.execFile(path.join(__dirname,'/generator.sh'),[n,c.pem,c.key,c.passphrase],
	function (error, stdout, stderr) {
		if (error !== null) {
			console.log('exec error: ' + error);
		}
		else {
			if (stderr)
				console.log("Error: " + stderr);
			else {
				console.log(stdout);
				callback();
			}

		}
	});
}

exports.createDevices = function (callback) {
	// read and parse the list of passphrases
	fs.readFile(path.join(__dirname, './tmp/passphrases/passphrases.txt'), 'utf-8', function (err, data) {
		
		if(err) {
			callback(err, null);
			return;
		}

		var passphrases = data.split('\n');
		passphrases.splice(-1,1);

		// read the directory for all certificates
		fs.readdir(path.join(__dirname, './tmp/certificates/crt'), function ( err, files ) {
			if(err) {
				callback(err, null);
				return;
			}

			var ret = [];
			err = [];

			for(var i=0; i<files.length; i++) {

				var random = Date.now() + '-' +  crypto.randomBytes(5).toString('hex').slice(0,10) + ".pem";	// Create random file name
				var index = parseInt(files[i].replace('.crt', ''));		// Get the index based on the filename
				var passphrase = passphrases[index - 1];		// Get the passphrase in the file using that index
				var p = path.join(__dirname, './tmp/certificates/crt', files[i]);	// create the absolute path to the crt files
				var newP = path.join(c.certs, random ); // create the new path for the pem files
				var cert = x509.parseCert(p);		// Parse the content of the cert

				var error = fs.renameSync(p.replace(/crt/g, 'pem'), newP);	// Move the pem file to a persistent location
				fs.unlink(p);	// Unlink unasynchronously after cp

				if(! error) {		// If there is no errors then treat the datas
					ret.push({passphrase: passphrase, fingerprint: cert.fingerPrint, path: newP})
				} else {
					err.push(error);
				}
			}
			callback(err, ret);
		});
	});
}