var util = require('util');
var perm = require('../index.js');


var that = {
	from : ["device", "56b5e4fc7a80b13b2149b900"],
	to: ["device", "56b5e4fc7a80b13b2149b901"],
	permissions : {temp: "read", iterations: "write"}
};

//perm.insert(that, function (err, result) {});

/*perm.list( 'device', "56b5e4fc7a80b13b2149b901", function (err, result) {
	console.log("LIST");
	console.log("Error : " + util.inspect(err));
	console.log("Result : " + util.inspect(result, {depth: 4}) );
});*/

/*perm.verify( {device : "56b5e4fc7a80b13b2149b901"}, {device : "56b5e4fc7a80b13b2149b900"}, {iterations: "write"}, function (err, result) {
	console.log("VERIFY");
	console.log("Error : " + util.inspect(err));
	console.log("Result : " + util.inspect(result, {depth: 4}) );
});*/

/*perm.remove('56b730d2263fc1c72769f000', function (err, result) {
	console.log("REMOVE");
	console.log("Error : " + util.inspect(err));
	//console.log("Result : " + util.inspect(result, {depth: 4}) );
	perm.list('device', "56b5e4fc7a80b13b2149b901", function (err, result) {
		console.log("LIST");
		console.log(util.inspect(result, {depth: 4}));
	});
});*/