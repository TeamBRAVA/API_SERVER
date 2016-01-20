var mongo = require('mongoskin');
module.exports = mongo.db('mongodb://localhost/test5');
console.log('Connected');
