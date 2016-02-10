var express = require('express');
var router = express.Router();
var jwt = require('jsonwebtoken');  //https://npmjs.org/package/node-jsonwebtoken
var expressJwt = require('express-jwt'); //https://npmjs.org/package/express-jwt
var fs = require('fs');

router.post('/user/authenticate', function (req, res) {
	var credentials = {
	    username: 'X',
	    password: 'Y',
	    _id: 1
	  };

  	//Sending user credentials inside the token
  	// sign with RSA SHA256 
	var cert = fs.readFileSync('../../CERTS/token.key');  // getting the private key 
	var token = jwt.sign(credentials, cert, { algorithm: 'RS256', expiresIn: 60*10}); //expires in 10 minutes (value in seconds)
  	res.json({ token: token });

});

module.exports = router;