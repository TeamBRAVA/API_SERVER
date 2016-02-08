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

/*perm.verify( {user : "56b5e4fc7a80b13b2149b901"}, {user : "56b5e4fc7a80b13b2149b901"}, {iterations: "write"}, function (err, result) {
	console.log("VERIFY");
	console.log("Error : " + util.inspect(err));
	console.log("Result : " + util.inspect(result, {depth: 4}) );
});*/