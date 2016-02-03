var mongo = require('mongoskin');
module.exports = mongo.db('mongodb://localhost/RED_DB');
console.log('Connected');
