var gen = require('../index.js');


gen.setCA('../../CERTS/CA/ca.pem', '../../CERTS/CA/ca.key', "Ek12Bb@.");
gen.setCertsFolder('../../CERTS/DEVICES');
gen.generateCertificates(5, function() {
	gen.createDevices(function (err, ret) {
		console.log(ret);
	});
});