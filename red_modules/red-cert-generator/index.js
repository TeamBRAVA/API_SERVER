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


/**
 * @fileOverview Device Certificate generator
 * @author {@link mailto:meetbrava@gmail.com|Team Brava}
 * @see {@link https://github.com/TeamBRAVA/API_SERVER|Github}
 * @version 1.0.0
 */

/**@namespace */
var _cert_generator = {


	/**
     * Set the Certificate Authority for signing the devices certificates
     * @param {string} pem The absolute path to the pem certificate file
     * @param {string} key The absolute path to the private key file to create the certificates
     * @param {string} passphrase The passphrase to unlock the certicate
     */
	setCA : function ( pem, key, passphrase) {
		c.pem = pem;
		c.key = key;
		c.passphrase = passphrase;
	},

	/**
     * Set the folder in which to store the created devices certificates
     * @param {string} folder The absolute path to the folder
     */
	setCertsFolder : function ( folder ) {
		c.certs = folder;
	},

	/**
     * Generate the corresponding certificates
     * @param {number} n The number of certificates to create
     * @param {function} callback Callback that is called when this function end (no parameters)
     */
	generateCertificates : function (n, callback) {
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
	},

	/**
     * Create all the devices with the certicates created with generateCertificates
     * @param {function} callback Callback that is called when this function end. Pass errors and an array to store fingerprint, passphrases and path to certificates files
     */
	createDevices : function (callback) {
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
	},

}



module.exports = _cert_generator;


