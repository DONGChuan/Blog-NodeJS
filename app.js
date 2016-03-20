/**
 * Created by dchuan on 2016/3/20.
 */
var express = require('express');
var path = require('path');
var bodyParser = require('body-parser');
var crypto = require('crypto');
var mongoose = require('mongoose');
var session = require('express-session');
var MongoStore = require('connect-mongo')(session);

mongoose.connect('mongodb://localhost:27017/notes');
mongoose.connection.on('error', console.error.bind(console, 'Connection fails'));

var models = require('./models/models');
var User = models.User;
var Note = models.Note;

var app = express();

// 建立 session 模型
app.use(session({
    key: 'session',
    secret: 'Keboard cat',
    cookie: {maxAge: 1000 * 60 * 60 * 24}, // 设置session的保存时间为1天
    // 连接mongoDB数据库必要设置
    store: new MongoStore({
        db: 'notes',
        mongooseConnection: mongoose.connection
    }),
    resave: false,
    saveUninitialized: true
}));

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(express.static(path.join(__dirname, 'public')));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true}));

app.get('/', function(req, res) {
    res.render('index', {
        title: 'Homepage'
    });
});

app.get('/', function(req, res) {
    Note.find({author: req.session.user.username})
        .exec(function(err, arts) {
            if(err) {
                console.log(err);
                return res.redirect('/');
            }
            res.render('index', {
                title: '笔记列表',
                user: req.session.user,
                arts: arts,
                moment: moment
            });
        })
});

app.get('/detail/:_id', function(req, res) {
    Note.findOne({_id: req.params._id})
        .exec(function(err, art) {
            if(err) {
                console.log(err);
                return res.redirect('/');
            }
            if(art) {
                res.render('detail', {
                    title: '笔记详情',
                    user: req.session.user,
                    art: art,
                    moment: moment
                });
            }
        });
});

app.get('/reg', function (req, res) {
    res.render('register', {
        title: 'Register',
        user: req.session.user,
        page: 'reg'
    })
});

app.get('/reg', function (req, res) {
    var username = req.body.username,
        password = req.body.password,
        passwordRepeat = req.body.passwordRepeat;

    if(password != passwordRepeat) {
        console.log('两次输入的密码不一致！');
        return res.redirect('/reg');
    }
    
    User.findOne({username: username}, function (err, user) {
        if(err) {
            console.log(err);
            return res.redirect('/reg');
        }

        if(user) {
            console.log('用户名已经存在');
            return res.redirect('/reg');
        }

        // 对密码进行md5加密
        var md5 = crypto.createHash('md5');
        var md5password = md5.update(password).digest('hex');

        var newUser = new User({
            username: username,
            password: md5password
        });

        newUser.save(function(err, doc) {
            if(err) {
                console.log(err);
                return res.redirect('/reg');
            }

            console.log('注册成功！');

            // 将登录用户信息存入session中
            // 考虑到保密性，记得将密码值删除，最后直接跳转到首页
            newUser.password = null;
            delete newUser.password;
            req.session.user = newUser;
            return res.redirect('/');
        });
    });
});

app.get('/login', function(req, res) {
    res.render('login', {
        title: 'Login',
        user: req.session.user,
        page: 'login'
    });
});

app.post('/login', function(req, res) {
    var username = req.body.username,
        password = req.body.password;

    User.findOne({username:username}, function(err, user) {

        if(err) {
            console.log(err);
            return next(err);
        }

        if(!user) {
            console.log('用户不存在！');
            return res.redirect('/login');
        }

        //对密码进行md5加密
        var md5 = crypto.createHash('md5'),
            md5password = md5.update(password).digest('hex');

        if(user.password !== md5password) {
            console.log('密码错误！');
            return res.redirect('/login');
        }

        console.log('登录成功！');

        user.password = null;
        delete user.password;
        req.session.user = user;

        return res.redirect('/');
    });
});

app.get('/post', function(req, res) {
    res.render('post', {
        title: '发布',
        user: req.session.user
    })
});

app.post('/post', function(req, res) {
    var note = new Note({
        title: req.body.title,
        author: req.session.user.username,
        tag: req.body.tag,
        content: req.body.content
    });

    note.save(function(err, doc) {
        if(err) {
            console.log(err);
            return res.redirect('/post');
        }
        console.log('文章发表成功！')
        return res.redirect('/');
    });
});

app.listen(3000, function(req, res) {
    console.log('app is running at port 3000');
});