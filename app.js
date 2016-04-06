'use strict';

// Import modules
var express    = require('express');
var app        = express();
var path       = require('path');
var bodyParser = require('body-parser');
var mongoose   = require('mongoose');
var session    = require('express-session');
var MongoStore = require('connect-mongo')(session);

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

// Routes =================================================================================
require('./app/routes.js')(app);

app.listen(3000, function(req, res) {
    console.log(app.get('views'));
    console.log('app is running at port 3000');
});