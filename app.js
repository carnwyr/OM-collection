const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const passport = require('passport')
const flash = require('connect-flash')
const session = require('express-session')
const MongoStore = require('connect-mongo')(session)
const bodyparser = require("body-parser");
require('dotenv').config();

var cardsController = require('./controllers/cardsController');

var indexRouter = require('./routes/index');
var cardsRouter = require('./routes/cards');
var userRouter = require('./routes/user');

var app = express();

var mongoose = require('mongoose');
var mongoDB = process.env.URI;
mongoose.connect(mongoDB, { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false });
mongoose.Promise = global.Promise;
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/js', express.static(__dirname + '/node_modules/bootstrap/dist/js')); // redirect bootstrap JS
app.use('/js', express.static(__dirname + '/node_modules/jquery/dist')); // redirect JS jQuery
app.use('/css', express.static(__dirname + '/node_modules/bootstrap/dist/css')); // redirect CSS bootstrap

app.use(express.urlencoded({limit: '50mb', extended: true}));
app.use(express.json({ limit: "50mb" }));

app.use(session({
    store: new MongoStore({
        url: mongoDB
    }),
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false,
    cookie : {
        maxAge: 1000* 60 * 60 *24 * 90,
        sameSite: 'lax'
    }
}))
app.use(passport.initialize())
app.use(passport.session())
app.use(flash());

app.use('/', indexRouter);
app.use('/card', cardsRouter);
app.use('/user', userRouter);

app.use(function(req, res, next) {
  next(createError(404));
});

app.use(function(err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  res.status(err.status || 500);
  res.render('error', { user: req.user });
});

module.exports = app;