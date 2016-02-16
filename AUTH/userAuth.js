var express = require('express');
var router = express.Router();
var jwt = require('jsonwebtoken');  //https://npmjs.org/package/node-jsonwebtoken
var expressJwt = require('express-jwt'); //https://npmjs.org/package/express-jwt
var fs = require('fs');
var red_users = require('../red_modules/red-users/');

router.post('/user/register', function (req, res) {
	var credentials = {
	    username: req.body.username,
	    password: req.body.password,
	    mail: req.body.mail
	  };
	//Check is username if it is already exists
	red_users.findUsername(credentials.username, function(err,result){
		if (result == null){
			//Sending user credentials inside the token
			var cert = fs.readFileSync('../../CERTS/token.key');  // getting the private key 
			var token = jwt.sign(credentials, cert, { algorithm: 'RS256', expiresIn: 60*10}); //expires in 10 minutes (value in seconds)
			//Storing the token inside the user credentials
		  	var completeCredentials = {
			    username: req.body.username,
			    password: req.body.password,
			    mail: req.body.mail,
			    token: token
			};
		  	//Creating a new User
		  	red_users.insert(completeCredentials,callback);
		  	//callback function
		    function callback(err, result) {
		        if (err)
		            res.status(404).send({message: 'Cannot register the user.'}); //404 Not Found
		        else
		        	res.json({ token: token });
		    }	
	  	}
	  	else{
	  		res.status(400).send({message: 'User already exist, try to login.'}); //400 Bad Request
	  	}
	});
});

router.post('/user/login', function (req, res) {
	var credentials = {
	    username: req.body.username,
	    password: req.body.password,
	  };
	//Check is username, password and token if they are valid
	red_users.verify(credentials, function(err,result){
		if (result != false){
			//Passing back the token
		  	res.json({ token: result }); //result=token which resides inside the user object
		}
		else if (result == false) {
			//check the error message returned by verify() to see the reason
			//if username and pass ok but token is outdated then create a new token and send it back

			//if passworderror do nothing

			//if tokenunmatcherror do nothing

			res.status(401).send({message: 'User is not authorized.'}); //401 Unauthorized
		}
	});
});

module.exports = router;