
/*
 * GET users listing.
 */

exports.list = function(req, res){
    if (!req.session.user)
    {
        res.redirect('/login');
        return;
    }
  res.render('users',{username:req.session.user.username,level:req.session.user.level});
};