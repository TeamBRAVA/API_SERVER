var jwt = require('jsonwebtoken');  //https://npmjs.org/package/node-jsonwebtoken
var expressJwt = require('express-jwt'); //https://npmjs.org/package/express-jwt
var express = require('express');
var router = express.Router();


router.post('/authenticate', function (req, res) {

  var newUser = {
    username: 'X',
    password: 'Y',
    _id: 1
  };

  // We are sending the profile inside the token
  var token = jwt.sign(profile, secret, { expiresInMinutes: 60*5 });

  res.json({ token: token });
});

module.exports = router;