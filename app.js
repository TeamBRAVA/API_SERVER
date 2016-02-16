var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

//Require the routes
var devices = require('./routes/devices');
var users = require('./routes/users');

//require certificat authentication functions
var auth = require('./red_modules/red-cert-auth');

//require swagger for the API documentation (http://swagger.io)
var swagger = require('swagger-jsdoc');

//express and parsers initialization
var app = express();
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

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
  apis: ['./routes/devices.js','./routes/users.js'], // Path to the files containing the documented routes
};

//generate the json text
var swaggerSpec = swagger(options);

//route for the swagger json
app.get('/api-docs.json', function(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});
/***************************************** */

// Custom middlewares
app.use(cors);
app.use(auth.certAuthenticate);
app.use(nocache);

// Custom routes
app.use('/', auth.ensureCertAuthenticated, devices);
app.use('/',users); //routes for the user authentication


module.exports = app;


// Custom middlewares definition
function nocache(req, res, next) {
  res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
  res.header('Expires', '-1');
  res.header('Pragma', 'no-cache');
  next();
}

function cors(req, res, next){
	res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST');
    res.header('Access-Control-Allow-Headers', 'X-Requested-With,content-type, Authorization');
    next();
}
