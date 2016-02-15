var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var devicesAPI = require('./API/devices');
var usersAPI = require('./API/users');
var auth = require('./AUTH/certAuth');
var userAuth = require('./AUTH/userAuth');

var fs = require('fs');
var swagger = require('swagger-jsdoc');

//express and parsers initialization
var app = express();
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

/* SWAGGER INITIALISATION */
var options = {
  swaggerDefinition: {
    info: {
      title: 'RED API',  
      description : 'This documentation is about RED API routes, you can find more on : [http://red-cloud.io](http://red-cloud.io)',
      version: '1.0.0',  
    },
  },
  apis: ['./API/devices.js','./AUTH/userAuth.js'], // Path to the API docs 
};

var swaggerSpec = swagger(options);

//route for the swagger json (TODO : maybe move it in a separate file !!)
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
app.use('/', auth.ensureCertAuthenticated, devicesAPI);
app.use('/', usersAPI); //to delete !!
app.use('/',userAuth); //routes for the user authentication


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
