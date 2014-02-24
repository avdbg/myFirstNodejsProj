
/*
 * GET home page.
 */

exports.index = function(req, res){
    if (req.session.user){
        res.redirect('/users');
        return;
    }

    if (req.cookies.username && req.cookies.password)
    {
        var login = require('../utils/utils').login;
        login(req.cookies.username,req.cookies.password,req.session,function(result){
            if (result)
            {
                res.redirect('/users');
                return;
            }
            res.redirect('/login');
        });
        return;
    }
    res.redirect('/login');
};