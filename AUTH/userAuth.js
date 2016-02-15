var express = require('express');
var router = express.Router();
var jwt = require('jsonwebtoken');  //https://npmjs.org/package/node-jsonwebtoken
var expressJwt = require('express-jwt'); //https://npmjs.org/package/express-jwt
var fs = require('fs');
var red_users = require('../red_modules/red-users/');
/**@swagger
 * definition: 
 *   NewUser:
 *     type: object
 *     required:
 *       - username
 *       - email
 *       - password
 *     properties:
 *       username:
 *         type: string
 *       email:
 *         type: string
 *         format: email
 *       password:
 *         type: string
 *         format: password
 * 
 */

/**
 *  @swagger
 *  /user/register:
 *    post:
 *      tags: [Users]
 *      description: register as a new user
 *      produces:
 *        - application/json
 *      parameters:
 *        - name: body
 *          description: user credentials to be added in the database
 *          in: body
 *          required: true
 *          schema: 
 *            $ref: '#/definitions/NewUser'
 *      responses:
 *        401:
 *          description: invalid inputs
 */
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

/**
 *  @swagger
 *  /user/login:
 *    post:
 *      tags: [Users]
 *      description: login to the dashboard, with the username and password provided
 *      produces:
 *        - application/json
 *      parameters:
 *        - name: body
 *          description: user credentials to be added in the database
 *          in: body
 *          required: true
 *          schema: 
 *            $ref: '#/definitions/NewUser'
 *      responses:
 *        200:
 *          description: authentified and the token is sent back to the user
 *        401:
 *          description: invalid inputs
 */
router.post('/user/login', function (req, res) {
	var credentials = {
	    username: req.body.username,
	    password: req.body.password,
	  };
	  //Check is username and password if they are valid
	red_users.verify(credentials, function(err,result){
		if (result == true){
		  	//Sending user credentials inside the token
			var cert = fs.readFileSync('../../CERTS/token.key');  // getting the private key 
			var token = jwt.sign(credentials, cert, { algorithm: 'RS256', expiresIn: 60*10}); //expires in 10 minutes (value in seconds)

			//record the token in the user
			// we neeed an updateuser function in pierre's index ? 

		  	res.json({ token: token });
		}
		else{
			res.status(401).send({message: 'User is not authorized.'});
		}
	});
});

module.exports = router;