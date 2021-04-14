const express = require("express");
const Sentry = require("@sentry/node");

const createError = require("http-errors");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const passport = require("passport");
const flash = require("connect-flash");
const session = require("express-session");
const MongoStore = require("connect-mongo")(session);
const bodyparser = require("body-parser");
require("dotenv").config();

var cardsController = require("./controllers/cardsController");

var indexRouter = require("./routes/index");
var cardsRouter = require("./routes/cards");
var userRouter = require("./routes/user");

const app = express();

// Sentry.init({ dsn: "https://b147d3a7c4e04bc88a15f8850a4bd610@o513655.ingest.sentry.io/5615947" });

var mongoose = require("mongoose");
var mongoDB = process.env.URI;
mongoose.connect(mongoDB, { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false });
mongoose.Promise = global.Promise;
var db = mongoose.connection;
db.on("error", console.error.bind(console, "MongoDB connection error:"));

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");

app.use(Sentry.Handlers.requestHandler());

app.use(logger("dev"));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(express.json({ limit: "50mb" }));

app.use(
  session({
    store: new MongoStore({
      url: mongoDB
    }),
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 90,
      sameSite: "lax"
    }
  })
);
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

app.use("/images/cards/:size", cardsController.directImage, express.static(path.join(__dirname, "public")));
app.use(express.static(path.join(__dirname, "public")));

app.use("/", indexRouter);
app.use("/card", cardsRouter);
app.use("/user", userRouter);

app.use(function(req, res, next) {
  next(createError(404));
});

app.use(Sentry.Handlers.errorHandler());

app.use(function(err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  res.status(err.status || 500);
  res.render("error", { title: "Page not found", user: req.user });
});


module.exports = app;
