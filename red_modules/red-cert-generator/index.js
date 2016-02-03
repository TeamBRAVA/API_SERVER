var child_process = require('child_process');
var util = require('util');
var fs = require('fs');
var path = require('path');
var x509 = require('x509');
var crypto = require('crypto');

// Load the DB interface
var db = require('../../DB/dbDevices');


exports.generateCertificates = function(n,pem,key,passphrase, callback) {
	pem = path.join(__dirname, pem);
	key = path.join(__dirname, key);
	child_process.execFile(__dirname+'/generator.sh',[n,pem,key,passphrase],
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
	fs.readFile('./tmp/passphrases/passphrases.txt', 'utf-8', function (err, data) {
		var passphrases = data.split('\n');
		passphrases.splice(-1,1);

		// read the directory for all certificates
		fs.readdir('./tmp/certificates/crt', function ( err, files ) {
			if(err) throw err;

			for(var i=0; i<files.length; i++) {

				var random = Date.now() + '-' +  crypto.randomBytes(5).toString('hex').slice(0,10) + ".pem";	// Create random file name
				var index = parseInt(files[i].replace('.crt', ''));		// Get the index based on the filename
				var passphrase = passphrases[index - 1];		// Get the passphrase in the file using that index
				var p = path.join(__dirname, './tmp/certificates/crt', files[i]);	// create the absolute path to the crt files
				var newP = path.join(__dirname, '../../CERTS/DEVICES/', random ); // create the new path for the pem files
				var cert = x509.parseCert(p);		// Parse the content of the cert

				var error = fs.renameSync(p.replace(/crt/g, 'pem'), newP);	// Move the pem file to a persistent location
				fs.unlink(p);

				if(! error) {		// If there is no errors then treat the datas
					db.insertDeviceWithCert(newP, passphrase, cert.fingerPrint, function (err, results) {
						if(!err) {
							console.log(" ######### INSERTED ##########  " + index);
							console.log(passphrase);
							console.log(cert.fingerPrint);
							console.log(newP);
						}
					});					
				}
			}


			callback();
		});
	});
}


function copy (dest, source, callback) {
	var source = fs.createReadStream('/path/to/source');
	var dest = fs.createWriteStream('/path/to/dest');
	var error = null;
	source.pipe(dest);
	source.on('end', function() { 
		callback(error);
	});
	source.on('error', function(err) {
		error = err;
	});
}