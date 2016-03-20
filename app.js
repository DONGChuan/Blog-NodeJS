var express = require('express');
var path = require('path');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var crypto = require('crypto');
var session = require('express-session');
var MongoStore = require('connect-mongo')(session);
var moment = require('moment');

var models = require('./models/models');
var User = models.User;
var Article = models.Article;

var checkLogin = require('./checkLogin.js');

var app = express();

mongoose.connect('mongodb://localhost:27017/notes');
mongoose.connection.on('error', console.error.bind(console, '连接数据库失败'));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(session({
    key: 'session',
    secret: 'Keboard cat',
    cookie: {maxAge: 1000 * 60 * 60 * 24},
    store: new MongoStore({
        db: 'notes',
        mongooseConnection: mongoose.connection
    }),
    resave: false,
    saveUninitialized: true
}));

app.get('/', checkLogin.noLogin);
app.get('/', function(req, res) {
    Article.find({author: req.session.user.username})
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

app.get('/reg', function(req, res) {
    res.render('register', {
        title: '注册',
        user: req.session.user,
        page: 'reg'
    });
});

app.post('/reg', function(req, res) {
    var username = req.body.username,
		password = req.body.password,
		passwordRepeat = req.body.passwordRepeat;

	//检查两次输入的密码是否一致
	if(password != passwordRepeat) {
		console.log('两次输入的密码不一致！');
		return res.redirect('/reg');
	}

	//检查用户名是否已经存在
	User.findOne({username:username}, function(err, user) {
		if(err) {
			console.log(err);
			return res.redirect('/reg');
		}

		if(user) {
			console.log('用户名已经存在');
			return res.redirect('/reg');
		}

		//对密码进行md5加密
		var md5 = crypto.createHash('md5'),
			md5password = md5.update(password).digest('hex');

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
			newUser.password = null;
			delete newUser.password;
			req.session.user = newUser;
			return res.redirect('/');
		});
	});
});

app.get('/login', function(req, res) {
    res.render('login', {
       title: '登录',
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

app.get('/quit', function(req, res) {
    req.session.user = null;
    console.log('退出成功！');
    return res.redirect('/login');
});

app.get('/post', function(req, res) {
    res.render('post', {
        title: '发布',
        user: req.session.user
    })
});

app.post('/post', function(req, res) {
    var data = new Article({
		title: req.body.title,
		author: req.session.user.username,
		tag: req.body.tag,
		content: req.body.content
	});

	data.save(function(err, doc) {
		if(err) {
		console.log(err);
			return res.redirect('/post');
		}
		console.log('文章发表成功！')
		return res.redirect('/');
	});
});

app.get('/detail/:_id', function(req, res) {
    Article.findOne({_id: req.params._id})
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

app.listen(3000, function(req, res) {
    console.log(app.get('views'));
    console.log('app is running at port 3000');
});