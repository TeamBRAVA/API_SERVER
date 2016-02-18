var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

//Require the routes
var devices = require('./routes/devices');
var users = require('./routes/users');
var docs = require('./routes/docs');

//require certificat authentication functions
var auth = require('./red_modules/red-cert-auth');

//express and parsers initialization
var app = express();
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Custom middlewares
app.use(cors);
app.use(auth.certAuthenticate);
app.use(nocache);

// Custom routes
app.use('/', docs);
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
