var util = require('util');
var devices = require('../index.js');


// devices.insertDevice(function(err,result){
//     console.log(result);
// });

// var obj = {
//     _id: "56c58fb6566c6db8248e64cb",
//     datatype: "temp",
//     value: "test"
// }
// devices.pushData(obj, function (err, result) {
//     console.log("push result" + result);
// })

var objToPull = {
    _id: "56c58fb6566c6db8248e64cb",
    datatype: "temp"
}
devices.pullDatatype(objToPull, function (err, result) {
    console.log("pull err: " + err);
    console.log("pull result : ");
    console.log(result);
})


var objDate = {
    _id: "56c58fb6566c6db8248e64cb",
    datatype: "temp",
    date: "1455788005867"
}
devices.pullDatatypeAndDate(objDate, function (err, result) {
    console.log("pull err: " + err);
    console.log("pull date result : ");
    console.log(result);
})