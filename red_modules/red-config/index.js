var path = require("path");
var ini = require("ini");
var fs = require("fs");
var path = require("path");

//retrieve data from config.ini file
var config = ini.parse(fs.readFileSync(path.join(__dirname, '../../config.ini'), 'utf-8'));

//store in an object
//if the user does not provide inputs for the parameters, it will be filled with default values
var options = {
    hostname: config.hostname,
    certsPath: {
        privateKey: path.join(__dirname, '../..', config.CERTS.privatePath != '' ? config.CERTS.privatePath : './CERTS/TOKEN/private.key'),
        publicKey: path.join(__dirname, '../..', config.CERTS.publicPath != '' ? config.CERTS.publicPath : './CERTS/TOKEN/public.key')
    },
    token: {
        algorithm: config.Token.algorithm != '' ? config.Token.algorithm : 'RS256',
        expiresIn: parseInt(config.Token.expiresIn != '' ? config.Token.expiresIn : '600'),
        ignoreExpiration: config.Token.timeout == '0' ? true : false
    },
    hash: {
        algorithm: config.Hash.algorithm != '' ? config.Hash.algorithm : 'sha256',
        saltLength: parseInt(config.Hash.saltLength != '' ? config.Hash.saltLength : '10'),
        iterations: parseInt(config.Hash.iterations != '' ? config.Hash.iterations : '2')
    }
};

//modify paths to be absolute paths
options.certsPath.privateKey = path.join(process.cwd(), options.certsPath.privateKey);
options.certsPath.publicKey = path.join(process.cwd(), options.certsPath.publicKey);

//check values provided by the user

//export the object
module.exports = options;