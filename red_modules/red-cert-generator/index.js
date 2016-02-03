var child_process = require('child_process');
exports.generateCertificates = function(n,pem,key,passphrase) {
	child_process.execFile(__dirname+'/generator.sh',[n,pem,key,passphrase],
	function (error, stdout, stderr) {
		if (error !== null) {
		  console.log('exec error: ' + error);
		}
		else {
			if (stderr)
				console.log("Error: " + stderr);
			else
				console.log(stdout);
		}
	});
}
