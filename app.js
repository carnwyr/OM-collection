const express = require("express");
const compression = require("compression");
const Sentry = require("@sentry/node");
const helmet = require("helmet");

const createError = require("http-errors");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const passport = require("passport");
const flash = require("connect-flash");
const session = require("express-session");
const MongoStore = require("connect-mongo")(session);
require("dotenv").config();

var cardsController = require("./controllers/cardsController");

var indexRouter = require("./routes/index");
var cardsRouter = require("./routes/cards");
var userRouter = require("./routes/user");
var eventsRouter = require("./routes/events");

const app = express();

const i18next = require("i18next");
const i18nextMiddleware = require("i18next-http-middleware");
const Backend = require("i18next-fs-backend");

Sentry.init({ environment: "production", dsn: process.env.SENTRY });

var mongoose = require("mongoose");
var mongoDB = process.env.URI;
mongoose.connect(mongoDB, { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false });
mongoose.Promise = global.Promise;
var db = mongoose.connection;
db.on("error", console.error.bind(console, "MongoDB connection error:"));

const eventCacheService = require("./services/eventCacheService");
eventCacheService.init();

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");

app.use(helmet({ contentSecurityPolicy: false }));
app.use(Sentry.Handlers.requestHandler());

var languageDetector = new i18nextMiddleware.LanguageDetector();
languageDetector.addDetector({
	name: "subdomain",
	lookup: function(req, res, options) {
		var subdomain = options.getHeaders(req).host.split('.')[0];
		switch(subdomain) {
			case "ja":
				var lang = "ja";
				break;
			case "zh":
				var lang = "zh";
				break;
			default:
				var lang = "en";
		}

		i18next.changeLanguage(lang);
		return lang;
	}, cacheUserLanguage: function(req, res, lng, options) {}
});

i18next
	.use(Backend)
	.use(languageDetector)
	.init({
		// debug: true,
		backend: {
			loadPath: __dirname + "/locales/{{lng}}/{{ns}}.json",
			addPath: __dirname + "/locales/{{lng}}/{{ns}}.missing.json"
		},
		fallbackLng: "en",
		preload: ["en", "ja", "zh"],
		// saveMissing: true,
    detection: { order: ["subdomain"] }
	});

app.use(i18nextMiddleware.handle(i18next));

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
app.use("/event", eventsRouter);

app.use(function (req, res, next) { next(createError(404)); });

app.use(Sentry.Handlers.errorHandler());

app.use(function (err, req, res, next) {
	//console.error(err)
	res.locals.message = err.message;
	res.locals.error = req.app.get("env") === "development" ? err : {};

	res.status(err.status || 500);
	res.render("error", { title: "Page not found", user: req.user });
});


module.exports = app;
