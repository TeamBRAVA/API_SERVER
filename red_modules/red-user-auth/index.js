var red_users = require('../red-users');

var userAuth = {
    // Middleware Auth. Function
    ensureAuthenticated: function (req, res, next) {
        req.user.token = null;
        var bearerToken;
        var bearerHeader = req.headers["authorization"];

        if (typeof bearerHeader !== 'undefined') {
            var bearer = bearerHeader.split(" ");
            bearerToken = bearer[1];

            if (bearerToken != null) {
                red_users.validateToken(bearerToken, function (err, result) {
                    //result is ok, user is authenticated and we store the cookie
                    if (result) {
                        console.log("user authenticated!");
                        req.user.token = bearerToken;
                        
                        //find user id with the token
                        red_users.findUserByToken(bearerToken, function (err, result) {
                            if (err) console.log(err);

                            req.user.id = result;
                        });
                    }
                    else if (err.message == "outdatedtoken") {
                        //token outdated, need to ask for another token (see with emre)
                        console.log("outdated token");
                        res.status(401).send("Unauthorized");
                    }
                    else if (err.message == "tokenunmatcherror") {
                        //else if token does not exist, do nothing, the user is not authenticated
                        res.status(401).send("Unauthorized");
                    }
                    next();
                });
            }
            else {
                res.status(401).send({ message: 'Invalid Token' });
            }
        }
        else {
            res.status(401).send({ message: 'Invalid Token' });
        }
    }

}

module.exports = userAuth;