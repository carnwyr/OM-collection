const express = require("express");
const compression = require("compression");
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

const i18next = require("i18next");
const i18nextMiddleware = require("i18next-http-middleware");
const Backend = require("i18next-fs-backend");

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

i18next
	.use(Backend)
	.use(i18nextMiddleware.LanguageDetector)
	.init({
		// debug: true,
		backend: {
			loadPath: __dirname + "/locales/{{lng}}/{{ns}}.json",
			addPath: __dirname + "/locales/{{lng}}/{{ns}}.missing.json"
		},
		fallbackLng: "en",
		preload: ["en", "ja"],
		saveMissing: true,
    detection: {
      order: ["querystring", "cookie"],
      caches: ["cookie"],
      lookupQuerystring: "lang",
      lookupCookie: "lang",
      ignoreCase: true,
      cookieSecure: false
    }
	});

app.use(i18nextMiddleware.handle(i18next));

app.use(function (req, res, next) {
	if (req.language !== i18next.t("lang")) {
		i18next.changeLanguage(req.language, (err, t) => {
	  	if (err) {
				Sentry.captureException(e);
				return console.error("Failed to switch i18n language", err);
			}
		});
	}
  next();
});

app.use(compression());
app.use(logger("dev"));
app.use(cookieParser());

app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(express.json({ limit: "50mb" }));

app.use(
	session({
		store: new MongoStore({ url: mongoDB }),
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

app.use(function(req, res, next) { next(createError(404)); });

app.use(Sentry.Handlers.errorHandler());

app.use(function(err, req, res, next) {
	res.locals.message = err.message;
	res.locals.error = req.app.get("env") === "development" ? err : {};

	res.status(err.status || 500);
	res.render("error", { title: "Page not found", user: req.user });
});


module.exports = app;
