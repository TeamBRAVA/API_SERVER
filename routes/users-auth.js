var express = require('express');
var router = express.Router();
var jwt = require('jsonwebtoken');  //https://npmjs.org/package/node-jsonwebtoken
var expressJwt = require('express-jwt'); //https://npmjs.org/package/express-jwt
var fs = require('fs');
var config = require('../red_modules/red-config');
var red_users = require('../red_modules/red-users');
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
 *       password:
 *         type: string
 *         format: password
 *   userLogin:
 *     type: object
 *     required:
 *       - username
 *       - password
 *     properties:
 *       username:
 *         type: string
 *       password:
 *         type: string
 *         format: password
 * 
 */

/**
 *  @swagger
 *  /register:
 *    post:
 *      tags: [Users Authentication]
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
                    res.status(404).send({ error: 'Cannot register the user.' }); //404 Not Found
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
 *      tags: [Users Authentication]
 *      description: login to the dashboard, with the username and password provided
 *      produces:
 *        - application/json
 *      parameters:
 *        - name: body
 *          description: user credentials to be added in the database
 *          in: body
 *          required: true
 *          schema: 
 *            $ref: '#/definitions/userLogin'
 *      responses:
 *        200:
 *          description: authentified and the token is sent back to the user
 *        401:
 *          description: invalid inputs
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