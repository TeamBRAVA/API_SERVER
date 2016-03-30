var util = require('util');
var devices = require('../index.js');


// devices.insertDevice(function(err,result){
//     console.log(result);
// });

// var obj = {
//     _id: "56c58fb6566c6db8248e64cb",
//     datatype: "moui",
//     value: "testfaux"
// }
// devices.pushData(obj, function (err, result) {
//     console.log("push result" + result);
// })

// devices.find("56c58fb6566c6db8248e64cb",function(err,result){
//     console.log("pull err: " + err);
//     console.log("pull result : ");
//     console.log(result);
// })

var objToPull = {
    id: "56c58fb6566c6db8248e64cb",
    datatype: "temp"
}
devices.pullDatatype(objToPull, function (err, result) {
    console.log("pull err d: " + err);
    console.log("pull result d: ");
    console.log(result);
})


var objDate = {
    id: "56c58fb6566c6db8248e64cb",
    datatype: "temp",
    date: "1455788014303"
}
devices.pullDatatypeAndDate(objDate, function (err, result) {
    console.log("pull err dd: " + err);
    console.log("pull date result dd: ");
    console.log(result);
    if(result != null){
         console.log("date in timestamp :" + parseInt(result.date));
        var date = new Date(parseInt(result.date));
        console.log("date in datetime : "+date)
    }
   
})