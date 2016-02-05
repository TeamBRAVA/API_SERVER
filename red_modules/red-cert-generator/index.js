var child_process = require('child_process');
var fs = require('fs');
var path = require('path');
var crypto = require('crypto');
var async = require('async');
var pem = require('pem');

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
			callback(err);
			return;
		}

		var passphrases = data.split('\n');
		passphrases.splice(-1,1);

		// read the directory for all certificates
		fs.readdir(path.join(__dirname, './tmp/certificates/'), function ( err, files ) {
			if(err) {
				callback(err);
				return;
			}
			var ret = [];
			var err = [];

				async.each(files, function(item, cb) {

					var random = Date.now() + '-' +  crypto.randomBytes(5).toString('hex').slice(0,10) + ".pem";	// Create random file name
					var index = parseInt(item.replace('.pem', ''));		// Get the index based on the filename
					var passphrase = passphrases[index - 1];		// Get the passphrase in the file using that index
					var p = path.join(__dirname, './tmp/certificates/', item);	// create the absolute path to the crt files
					var newP = path.join(c.certs, random ); // create the new path for the pem files
					var certificate = fs.readFileSync(p);
					pem.getFingerprint(certificate.toString(), function ( error, fingerprint ) {
						if(error) {
							err.push(error);
							cb();
							return;
						}
						error = fs.renameSync(p.replace(/crt/g, 'pem'), newP);	// Move the pem file to a persistent location
						if(! error) {		// If there is no errors then treat the datas
							ret.push({passphrase: passphrase, fingerprint: fingerprint.fingerprint, path: newP})
						} else {
							err.push(error);
						}
						cb();
					});		// Parse the content of the cert
				}, function done() {
					// Clear temporary directories
					fs.readdir(path.join(__dirname, './tmp/certificates/'), function ( err, files ) { 
						files.forEach(function (file) {
							fs.unlink(path.join(__dirname, './tmp/certificates/', file));
						});
					});
					fs.unlink(path.join(__dirname, './tmp/passphrases/passphrases.txt'), function() {});	// remove passphrases
					callback(err, ret);
				});
			
		});
	});
}