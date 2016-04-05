var express = require('express');
var router = express.Router();
var jwt = require('jsonwebtoken');  //https://npmjs.org/package/node-jsonwebtoken
var expressJwt = require('express-jwt'); //https://npmjs.org/package/express-jwt
var fs = require('fs');
var config = require('../red_modules/red-config');
var red_users = require('../red_modules/red-users');



/**
*  @swagger
*  /register:
*    post:
*      tags: [Users]
*      description: Register a new user into the service
*      produces:
*        - application/json
*      parameters:
*        - name: params
*          description: user credentials to be added in the database
*          in: body
*          required: true
*          schema: 
*               type: object
*               properties : 
*                   username : 
*                       type: string
*                       description: the username of the user
*                   mail : 
*                       type: string
*                       description: the user mail
*                   password :
*                       type: string
*                       description: plain text password send over TLS tunnel
*      responses:
*
*        ' 200':
*           description: return the token of the newly created user
*           schema:
*               type: object
*               properties : 
*                   token : 
*                        type: string
*                        description: The newly authorization token created
*        ' 400':
*           description: user already exist in the database
*           schema:
*               type: object
*               properties : 
*                   code : 
*                       type: string
*                       description: HTTP code for the request (400)
*                   status : 
*                       type: string
*                       description: Status corresponding to the code (Bad Request)
*                   message : 
*                       type: string
*                       description: Custom message from the API
*        ' 500':
*           description: Internal Server Error
*           schema:
*               type: object
*               properties : 
*                   code : 
*                       type: string
*                       description: HTTP code for the request (500)
*                   status : 
*                       type: string
*                       description: Status corresponding to the code (Internal Server Error)
*                   message : 
*                       type: string
*                       description: Custom message from the API
*/
router.post('/register', function(req, res) {
    var credentials = {
        username: req.body.username,
        password: req.body.password,
        mail: req.body.mail
    };
    //Check is username if it is already exists
    red_users.findUsername(credentials.username, function(err, result) {
        if (result == null) {
            //Sending user credentials inside the token
            var cert = fs.readFileSync(config.certsPath.privateKey);  // getting the private key DOES NOT WORK FOR API_SERVER, do ../CERTS/token.key
            var token = jwt.sign(credentials, cert, { algorithm: config.token.algorithm, expiresIn: config.token.expiresIn }); //expires in 10 minutes (value in seconds)
            //Storing the token inside the user credentials
            var completeCredentials = {
                username: req.body.username,
                password: req.body.password,
                mail: req.body.mail,
                token: token
            };
            //Creating a new User
            red_users.insert(completeCredentials, callback);
            //callback function
            function callback(err, result) {
                if (err){
                    console.log(err);
                    res.status(500).send({ error: 'Cannot register the user.' }); //500 Internal server error
                }
                else
                    res.status(200).json({ token: token });
            }
        }
        else {
            console.log(err);
            res.status(400).send({ error: 'User already exist, try to login.' }); //400 Bad Request
        }
    });
});

/**
*  @swagger
*  /login:
*    post:
*      tags: [Users]
*      description: Login a user to the service, returning the new authorization token
*      produces:
*        - application/json
*      parameters:
*        - name: params
*          description: user credentials
*          in: body
*          required: true
*          schema: 
*               type: object
*               properties : 
*                   username : 
*                       type: string
*                       description: the username of the user
*                   password :
*                       type: string
*                       description: plain text password send over TLS tunnel
*      responses:
*
*        ' 200':
*           description: return the token of the newly created user
*           schema:
*               type: object
*               properties : 
*                   token : 
*                        type: string
*                        description: The newly authorization token created
*        ' 400':
*           description: user already exist in the database
*           schema:
*               type: object
*               properties : 
*                   code : 
*                       type: string
*                       description: HTTP code for the request (400)
*                   status : 
*                       type: string
*                       description: Status corresponding to the code (Bad Request)
*                   message : 
*                       type: string
*                       description: Custom message from the API
*        ' 500':
*           description: Internal Server Error
*           schema:
*               type: object
*               properties : 
*                   code : 
*                       type: string
*                       description: HTTP code for the request (500)
*                   status : 
*                       type: string
*                       description: Status corresponding to the code (Internal Server Error)
*                   message : 
*                       type: string
*                       description: Custom message from the API
*/
router.post('/login', function(req, res) {
    var credentials = {
        username: req.body.username,
        password: req.body.password,
    };
    //Check is username, password and token if they are valid
    red_users.verifyAndLogin(credentials, function(err, result) {
        if (result != false) {
            res.status(200).json({ token: result });
        }
        else {
            console.log(err);
            res.status(401).send({ error: 'Unauthorized' }); //401 Unauthorized
        }
    });
});

module.exports = router;