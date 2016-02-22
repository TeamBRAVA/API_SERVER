var red_users = require('../red-users');

var userAuth = {
    tokenAuth: function (req, res, next) {
        var bearerToken = req.cookie.token;
        req.user.verified = false;

        if (bearerToken != null) {
            red_users.validateToken(bearerToken, function (err, result) {
                //result is ok, user is authenticated and we store the cookie
                if (result) {
                    console.log("user authenticated!");
                    req.user.verified = true;
                    req.user.token = bearerToken;
                } else if (err.message == "outdatedtoken") {
                    //token outdated, need to ask for another token (see with emre)
                    console.log("outdated token");
                } else if (err.message == "") {
                    //else if token does not exist, do nothing, the user is not authenticated
                    res.status(401).send("Unauthorized");
                }
                next();
            });
        } else {
            res.status(401).send("Unauthorized");
        }
    }
}

module.exports = userAuth;