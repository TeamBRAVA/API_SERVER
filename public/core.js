var redAPI = angular.module('redAPI', []);

redAPI.controller('mainController', function ($scope, $http) {

});

redAPI.controller('resultController', function ($scope, $http) {
    $scope.formData = {};
    
    // when landing on the page, get all devices and show them
    $http.get('/result')
        .success(function (data) {
            $scope.devices = data;
            console.log(data);
        })
        .error(function (data) {
            console.log('Error: ' + data);
        });

    $scope.addData = function () {
        $http.post('/API/device', $scope.formData)
            .success(function () {
                $http.get('/result')
                    .success(function (data) {
                        $scope.devices = data;
                        console.log(data);
                    })
                    .error(function (data) {
                        console.log('Error: ' + data);
                    });
            })
            .error(function (data) {
                console.log('Error: ' + data);
            });
    }
});
