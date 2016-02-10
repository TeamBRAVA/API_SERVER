var express = require('express');
var router = express.Router();
var jwt = require('jsonwebtoken');  //https://npmjs.org/package/node-jsonwebtoken
var expressJwt = require('express-jwt'); //https://npmjs.org/package/express-jwt
var fs = require('fs');
var red_users = require('./red_modules/red-users/test/');

router.post('/user/register', function (req, res) {
	var credentials = {
	    username: req.body.username,
	    password: req.body.password,
	    mail: req.body.mail
	  };
	  //Check is username if it is already exists
	  red_users.findUsername(username,function(err,result){
	  	if (result == null){
		  	//Sending user credentials inside the token
			var cert = fs.readFileSync('../../CERTS/token.key');  // getting the private key 
			var token = jwt.sign(credentials, cert, { algorithm: 'RS256', expiresIn: 60*10}); //expires in 10 minutes (value in seconds)
		  	
		  	//Creating a new User
		  	red_users.insert(credentials,callback);
		  	//callback function
		    function callback(err, result) {
		        if (err)
		            res.respond(err, 404);
		        else
		        	res.json({ token: token });
		    }	
	  	}
	  	else{
	  		res.status(401).send({message: 'User already exist, try to login.'});
	  	}
	  });
});

router.post('/user/login', function (req, res) {
	var credentials = {
	    username: req.body.username,
	    password: req.body.password,
	  };
	  //Check is username and password if they are valid
	  
  	//Sending user credentials inside the token
  	// sign with RSA SHA256 
	var cert = fs.readFileSync('../../CERTS/token.key');  // getting the private key 
	var token = jwt.sign(credentials, cert, { algorithm: 'RS256', expiresIn: 60*10}); //expires in 10 minutes (value in seconds)
  	res.json({ token: token });

});

module.exports = router;