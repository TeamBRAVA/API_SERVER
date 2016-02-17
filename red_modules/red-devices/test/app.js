var util = require('util');
var devices = require('../index.js');



var objToPull = {
    _id: "56c4d88ecd2f95b4292f133c",
    datatype: "temp"
}
devices.pullDatatype(objToPull, function (err, result) {
    console.log("pull err: " + err);
    console.log("pull result : ");
    console.log(result);
})


var objDate = {
    _id: "56c4d88ecd2f95b4292f133c",
    datatype: "temp",
    date: "Wed Feb 17 2016 21:58:16 GMT+0100"
}
devices.pullDatatypeAndDate(objDate,function(err,result){
    console.log("pull err: " + err);
    console.log("pull date result : ");
    console.log(result);
})



var obj = {
    _id: "56c4d88ecd2f95b4292f133c",
    datatype: "temp",
    value: "1234"
}
/*devices.pushData(obj, function (err, result) {
    console.log("push result" + result);
})*/
