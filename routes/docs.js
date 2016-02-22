var express = require('express');
var router = express.Router();

//require swagger for the API documentation (http://swagger.io)
var swagger = require('swagger-jsdoc');

/* SWAGGER INITIALISATION */
/*swagger-jsdoc uses a options object to define general informations about the api */
var options = {
  swaggerDefinition: {
    info: {
      title: 'RED API',  
      description : 'This documentation is about RED API routes, you can find more on : [http://red-cloud.io](http://red-cloud.io)',
      version: '1.0.0', 
    },
    tags: [
    {
        name: 'Devices',
        description: 'routes to manage devices'
    },
    {
        name: 'Permissions',
        description: 'routes to manage permissions'
    },
    {
        name: 'Users',
        description: 'routes to manage users'
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