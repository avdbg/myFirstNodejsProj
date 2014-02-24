/**
 * Created by Crazy on 14-2-21.
 */

exports.login = function(uid,pwd,session,callback)
{
    global.db.Users.findOne({username:uid,password:pwd},function(err,doc){
        if (err || !doc)
        {
            callback(false);
            return;
        }

        session.user = {username:uid,password:pwd,level:doc.level};
        callback(true);
    });
}
