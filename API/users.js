var express = require('express');
var router = express.Router();
require('./response');
var db = require('../DB/dbUsers');
/**
 * @swagger
 * tags:
 *   name: users
 *   description: users management routes
 *   
 */

/**@swagger
 * definition: 
 *   user:
 *     type: object
 *     required:
 *       - token
 *       - expirationDate
 *     properties:
 *       token:
 *         type: string
 *       password:
 *         type: string
 *         format: password
 * 
 */
/**
 *  @swagger
 *  /user/new:
 *    post:
 *      tags: [Users]
 *      description: creates a new user
 *      produces:
 *        - application/json
 *      parameters:
 *        - name: userid
 *          description: user id 
 *          in: body
 *          required: true
 *          type: String
 *          schema: 
 *            $ref: '#/definitions/user'
 *      responses:
 *        200:
 *          description: user was created
 */ 
router.post('/user/new', function (req, res) {
    //Create the object
    var user = {
        userid: req.body.userid,
        token: req.body.token,
        expirationdate: req.body.expirationdate
    }
    db.insertUser(user, callback);
  
    //callback function
    function callback(err, result) {
        if (err)
            res.respond(err, 404);
        else
            res.respond(result);
    }
});

/**
 *  @swagger
 *  /user/update:
 *    post:
 *      tags: [Users]
 *      description: update a user
 *      produces:
 *        - application/json
 *      parameters:
 *        - name: user
 *          description: user object
 *          in: body
 *          required: true
 *          type: object
 *          schema: 
 *            $ref: '#/definitions/user'
 *      responses:
 *        200:
 *          description: user was created
 */
router.post('/user/update', function (req, res) {
    //Create the object
    var user = {
        userid: req.body.userid,
        token: req.body.token,
        expirationdate: req.body.expirationdate
    }
    db.updateUser(user, callback);
  
    //callback function
    function callback(err, result) {
        if (err)
            res.respond(err, 404);
        else
            res.respond(result);
    }
});

module.exports = router;