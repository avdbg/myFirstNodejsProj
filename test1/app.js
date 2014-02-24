
/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');
var user = require('./routes/user');
var http = require('http');
var path = require('path');

var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(express.cookieParser('Aochuang'));
app.use(express.session());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

var  mongodb = require('mongodb');
var  server  = new mongodb.Server('localhost', 27017, {auto_reconnect:true});
var  db = new mongodb.Db('QueueStats', server, {safe:true});
db.open(function(err, db){
   if (err){
       return;
   }

    db.createCollection('Users', {safe:true}, function(err, collection){
        if(err){
            return;
        }
        global.db = {Users:collection};
    });

});

app.get('/', routes.index);
app.get('/users', user.list);
app.get('/login',function(req,res){
    var login = require('./utils/utils').login;
    if (req.session.user)
    {
        login(req.session.user.username,req.session.user.password,req.session,function(result){
            if (result)
            {
                res.redirect('/users');
                return;
            }
            res.redirect('/login');
        });
        return;
    }

    if (req.cookies.username && req.cookies.password)
    {
        login(req.cookies.username,req.cookies.password,req.session,function(result){
            if (result)
            {
                res.redirect('/users');
                return;
            }
            res.redirect('/logout');
        });
        return;
    }

    res.render('login',{login_failed:req.query.login_fail});
});
app.post('/login',function(req, res){
    var login = require('./utils/utils').login;
    login(req.body.username,req.body.password,req.session,function(result){
        if (result)
        {
            //console.log(req.body.remember);
            if (req.body.remember)
            {
                res.cookie('username',req.body.username);
                res.cookie('password',req.body.password);
            }

            res.redirect('/');
            return;
        }

        res.redirect('/login?login_fail=true');
    });
});

app.get('/logout',function(req,res){
    req.session.user = null;
    res.clearCookie('username');
    res.clearCookie('password');
    res.redirect('/login');
});

app.get('/manageUsers',function(req,res){
    if (!req.session.user || req.session.user.level != 1)
    {
        res.send('权限不足或登陆超时，请重新登录');
        return;
    }
    global.db.Users.find().toArray(function(err,docs){
        if (err)
        {
            res.send('500');
            return;
        }
        res.locals({users:docs});
        res.render('manageUsers');
    });
});

app.get('/userInfo',function(req,res){
    if (!req.session.user || req.session.user.level != 1)
    {
        res.send('权限不足或登陆超时，请重新登录');
        return;
    }

    var uid = req.query.username;
    if (!uid)
    {
        res.send('请勿直接访问本页面');
        return;
    }
    global.db.Users.findOne({username:uid},function(err,doc){
        if (err)
        {
            res.send('查无此人');
            return;
        }

        res.render('userInfo',{username:doc.username,password:doc.password,level:doc.level});
    });
});

app.post('/updateUserInfo',function(req,res){
    if (!req.session.user || req.session.user.level != 1)
    {
        res.send('权限不足或登陆超时，请重新登录');
        return;
    }

    if (!req.body.username || !req.body.password || !req.body.level || !req.body.oldName)
    {
        res.send('404');
        return;
    }

    global.db.Users.update({username:req.body.oldName},
        {username:req.body.username,password:req.body.password,level:parseInt(req.body.level)},{upsert:false},function(err){
            if (err)
            {
                res.send('输入的信息有误');
                return;
            }

            res.send('修改成功');
        })
});

app.get('/addUser',function(req,res){
    if (!req.session.user || req.session.user.level != 1)
    {
        res.send('权限不足或登陆超时，请重新登录');
        return;
    }
    res.render('addUser');
});

app.post('/addUser',function(req,res){
    if (!req.session.user || req.session.user.level != 1)
    {
        res.send('权限不足或登陆超时，请重新登录');
        return;
    }

    if (!req.body.username || !req.body.password || !req.body.level)
    {
        res.send('输入的信息有误');
        return;
    }
    global.db.Users.insert({username:req.body.username,password:req.body.password,level:parseInt(req.body.level)},function(err){
        if (err)
        {
            res.send('添加用户失败');
            return;
        }

        res.redirect('/manageUsers');
    });
});

app.get('/deleteUser',function(req,res){
    if (!req.session.user || req.session.user.level != 1)
    {
        res.send('权限不足或登陆超时，请重新登录');
        return;
    }

    global.db.Users.remove({username:req.query.username},function(err,num){
        if (err)
        {
            res.send('删除失败');
            return;
        }

        res.redirect('/manageUsers');
    });
});

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
