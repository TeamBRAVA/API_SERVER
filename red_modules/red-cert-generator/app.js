var gen = require('./index.js');

gen.generateCertificates(5, '../../CERTS/CA/ca.pem', '../../CERTS/CA/ca.key', "Ek12Bb@.", function() {
	gen.createDevices(function() {
		console.log("ALL DONE");
	});
});