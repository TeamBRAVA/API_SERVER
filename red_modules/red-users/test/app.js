var util = require('util');
var user = require('../index.js');


var that = {
	username : "Janko",
	mail : "p.jankowiez@gmail.com",
	password : "secret"
};
var thus = {
	username : "thomas",
	mail : "thomas.berthaud@edu.ece.fr",
	password : "second secret"
};
var camille = {
	username : "Camille",
	mail : "camille.gilloots@edu.ece.fr",
	password: "je t'aime"
};

/*
user.insert(camille, function (err, result) {
	console.log('Errors : ' + util.inspect(err));
	console.log('Results : ' + util.inspect(result, {depth : 4}));
});*/

/*user.list( function (err, result) {
	console.log('Errors : ' + util.inspect(err));
	console.log('Results : ' + util.inspect(result, {depth : 4}));
});*/

/*
user.remove("56ba6bd200b3e1f52bff19a3", function (err, result) {
	console.log('Errors : ' + util.inspect(err));
	console.log('Results : ' + util.inspect(result, {depth : 4}));
});*/

/*user.findMail("thomas.berthaud@edu.ece.fr", function (err, result) {
	console.log('Errors : ' + util.inspect(err));
	console.log('Results : ' + util.inspect(result, {depth : 4}));
});*/

/*user.findUsername("thomas", function (err, result) {
	console.log('Errors : ' + util.inspect(err));
	console.log('Results : ' + util.inspect(result, {depth : 4}));
});*/

/*user.find("56ba6ac01a5953642b5e5e12", function (err, result) {
	console.log('Errors : ' + util.inspect(err));
	console.log('Results : ' + util.inspect(result, {depth : 4}));
});*/

/*user.addDevice( "56ba6ac01a5953642b5e5e12" ,"56ba6f6020a727d92cf75d2c", function (err, result) {
	console.log('Errors : ' + util.inspect(err));
	console.log('Results : ' + util.inspect(result, {depth : 4}));
});*/

/*user.own("56ba6ac01a5953642b5e5e12", function (err, result) {
	console.log('Errors : ' + util.inspect(err));
	console.log('Results : ' + util.inspect(result, {depth : 4}));
});*/

/*user.removeDevice("device1", "56ba6ac01a5953642b5e5e12", function (err, result) {
	console.log('Errors : ' + util.inspect(err));
	console.log('Results : ' + util.inspect(result, {depth : 4}));
});*/

