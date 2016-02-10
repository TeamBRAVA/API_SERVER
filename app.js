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

var app = express();
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

// Custom middlewares
app.use(auth.certAuthenticate);
app.use(nocache);
app.use(cors);

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
