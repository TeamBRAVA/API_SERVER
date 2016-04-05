var express = require('express');
var router = express.Router();

//require swagger for the API documentation (http://swagger.io)
var swagger = require('swagger-jsdoc');

/* SWAGGER INITIALISATION */
/*swagger-jsdoc uses a options object to define general informations about the api */
var options = {
  swaggerDefinition: {
    info: {
      title: 'Documentation about the API of the RED online service',  
      description : 'This documentation deals with the special API of the RED SaaS solution. You can find more on [http://docs.red-cloud.io](http://docs.red-cloud.io)',
      version: '0.0.2', 
    },
    tags: [
    {
        name: 'Devices',
        description: 'Routes accessible by a device only with its certificate || URL : https://device.red-cloud.io'
    },
    {
        name: 'Users',
        description: 'Routes accessible by a user only || URL : https://user.red-cloud.io'
    }]
  },
  apis: ['./routes/devices.js','./routes/users-auth.js', './routes/users.js'], // Path to the files containing the documented routes
};

//generate the json text
var swaggerSpec = swagger(options);

//route for the swagger json
router.get('/api-docs.json', function(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});
/***************************************** */

module.exports = router;