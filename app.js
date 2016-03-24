'use strict';

// Import modules
var express    = require('express');
var app        = express();
var path       = require('path');
var bodyParser = require('body-parser');
var mongoose   = require('mongoose');
var crypto     = require('crypto');
var session    = require('express-session');
var MongoStore = require('connect-mongo')(session);
var moment     = require('moment');

// Import models
var models = require('./models/models');
var User = models.User;
var Article = models.Article;

var checkLogin = require('./checkLogin.js');

// Connect to db
mongoose.connect('mongodb://localhost:27017/notes');
var mongoDB = mongoose.connection;
mongoDB.on('error', console.error.bind(console, 'Fail to connect db'));

// Setup view engine setup
app.set('views', path.join(__dirname, './views'));
app.set('view engine', 'ejs');

// Load static files
app.use(express.static(path.join(__dirname, 'public')));

// Parser body
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Session
app.use(session({
    c: 'session',
    secret: 'doubi',
    cookie: {maxAge: 1000 * 60 * 60 * 24},
    store: new MongoStore({
        db: 'notes',
        mongooseConnection: mongoDB
    }),
    resave: true,
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

app.route('/reg')
    .get(function(req, res) {
        res.render('register', {
            title: 'Register',
            user: req.session.user,
            page: 'reg'
        })
    })
    .post('/reg', function(req, res) {
        var username = req.body.username;
        var password = req.body.password;
        var passwordRepeat = req.body.passwordRepeat;

        if(password != passwordRepeat) {
            console.log('You must enter the same passwords！');
            return res.redirect('/reg');
        }

        // Check whether user already exits
        User.findOne({username:username}, function(err, user) {
            if(err) {
                console.log(err);
                return res.redirect('/reg');
            }

            if(user) {
                console.log('Username already exits');
                return res.redirect('/reg');
            }

            // Md5 for password
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
                console.log('Register successfully！');

                newUser.password = null;
                delete newUser.password;
                req.session.user = newUser;

                return res.redirect('/');
            });
        });
    });

app.route('/login')
    .get(function(req, res) {
        res.render('login', {
           title: 'Login',
           user: req.session.user,
           page: 'login'
        });
    })
    .post(function(req, res) {
        var username = req.body.username,
            password = req.body.password;

        User.findOne({username:username}, function(err, user) {
            if(err) {
                console.log(err);
                return next(err);
            }
            if(!user) {
                console.log('User not exists！');
                return res.redirect('/login');
            }

            // md5 for password
            var md5 = crypto.createHash('md5'),
                md5password = md5.update(password).digest('hex');

            if(user.password !== md5password) {
                console.log('Wrong password！');
                return res.redirect('/login');
            }

            console.log('Login successfully！');

            user.password = null;
            delete user.password;
            req.session.user = user;

            return res.redirect('/');
        });
    });

app.get('/quit', function(req, res) {
    req.session.user = null;
    console.log('Login out successfully！');

    return res.redirect('/login');
});

app.route('/post')
    .get(function(req, res) {
        res.render('post', {
            title: 'Post',
            user: req.session.user
        })
    })
    .post(function(req, res) {

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

            console.log('Post successfully！');

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
                    title: 'Post Content',
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