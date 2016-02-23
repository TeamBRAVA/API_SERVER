var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

//Require the routes
var devices = require('./routes/devices');
var users = require('./routes/users');
var usersAuth = require('./routes/users-auth');
var docs = require('./routes/docs');

//require certificate and token authentication functions
var auth = require('./red_modules/red-auth');

//express and parsers initialization
var app = express();
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Custom middlewares
app.use(cors);
app.use(nocache);

//retrieve info from requests to be authenticated
app.use(auth.certAuthenticated);
app.use(auth.tokenAuthenticated);

/**  CUSTOM ROUTES */
//route for swagger documentation
app.use('/', docs);

//routes for the user authentication
app.use('/', usersAuth);

//devices routes are accessible either with a certificate or a token
app.use('/', auth.gateway, devices);
app.use('/', auth.gateway, users);

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