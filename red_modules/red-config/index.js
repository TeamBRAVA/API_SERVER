
var ini = require("ini");
var fs = require("fs");
var path = require("path");

//retrieve data from config.ini file
var config = ini.parse(fs.readFileSync('./config.ini', 'utf-8'));

//store in an object
//if the user does not provide inputs for the parameters, it will be filled with default values
var options = {
    hostname: config.hostname,
    certsPath: {
        privateKey: config.CERTS.privateKey != '' ? config.CERTS.privateKey : 'CERTS/TOKEN/private.key',
        publicKey: config.CERTS.publicKey != '' ? config.CERTS.publicKey : 'CERTS/TOKEN/public.key'
    },
    token: {
        algorithm: config.Token.algorithm != '' ? config.Token.algorithm : 'RS256',
        expiresIn: config.Token.expiresIn != '' ? config.Token.expiresIn : '600',
        ignoreExpiration: config.Token.timeout == '0' ? true : false
    },
    hash: {
        algorithm: config.Hash.algorithm != '' ? config.Hash.algorithm : 'sha256',
        saltLength: config.Hash.saltLength != '' ? config.Hash.saltLength : '10',
        iterations: config.Hash.iterations != '' ? config.Hash.iterations : '2'
    }
};

//modify paths to be absolute paths
options.certsPath.privateKey = path.join(process.cwd(), options.certsPath.privateKey);
options.certsPath.publicKey = path.join(process.cwd(), options.certsPath.publicKey);

//check values provided by the user

//export the object
module.exports = options;