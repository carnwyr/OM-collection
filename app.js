require("dotenv").config();

const express = require("express");
const session = require("express-session");
const mongoose = require("mongoose");
const MongoStore = require("connect-mongo")(session);
const createError = require("http-errors");
const cookieParser = require("cookie-parser");
const Sentry = require("@sentry/node");
const logger = require("morgan");
const helmet = require("helmet");
const passport = require("passport");
const compression = require("compression");
// TODO remove
const flash = require("connect-flash");

const utils = require("./services/utils");

const indexRouter = require("./routes/index");
const cardsRouter = require("./routes/cards");
const userRouter = require("./routes/user");
const eventsRouter = require("./routes/events");
const suggestionRouter = require("./routes/suggestions");
const askKarasuRouter = require("./routes/askKarasu");

const localizationService = require("./services/localizationService");
const cacheService = require("./services/cacheService");
const cardsController = require("./controllers/cardsController");

Sentry.init({ environment: process.env.NODE_ENV, dsn: process.env.SENTRY });

const app = express();
app.set("views", __dirname + "/views");
app.set("view engine", "pug");

mongoose.connect(process.env.URI, { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false });
mongoose.Promise = global.Promise;
mongoose.connection.on("error", console.error.bind(console, "MongoDB connection error:"));

app.use(Sentry.Handlers.requestHandler());
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(express.json({ limit: "50mb" }));
app.use(
	session({
		store: new MongoStore({ url: process.env.URI }),
		secret: process.env.SECRET,
		resave: false,
		saveUninitialized: false,
		cookie: {
			maxAge: 1000 * 60 * 60 * 24 * 90,
			sameSite: "lax"
		}
	})
);

app.use(cookieParser());
app.use(compression());
app.use(helmet({ contentSecurityPolicy: false }));
app.use(logger("dev", { skip: (req, res) => req.app.get("env") !== "production" }));

app.use(passport.initialize());
app.use(passport.session());

app.use(localizationService.getLocalizationMiddleware(false));
app.use(flash());

app.use("/images/cards/:size", cardsController.directImage, express.static(__dirname + "/public"));
app.use(express.static(__dirname + "/public"));

// TODO handle errors in async controllers
app.use((req, res, next) => {
	res.locals.cookies = req.cookies;
	try {
		next();
	} catch (err) {
		next(err);
	}
});

app.use("/", indexRouter);
app.use("/card", cardsRouter);
app.use("/user", userRouter);
app.use("/event", eventsRouter);
app.use("/suggestion", suggestionRouter);
app.use("/ask", askKarasuRouter);
app.use((req, res, next) => next(createError(404)));

app.use(Sentry.Handlers.errorHandler());

app.use(function (err, req, res, next) {
	if (err.status != 404) {
		console.error(err)
		if (req.app.get("env") === "production") {
			Sentry.captureException(err);
		}
	}
	// TODO check if needed
	res.locals.message = err.message;
	res.locals.error = req.app.get("env") === "development" ? err : {};

	res.status(err.status || 500);
	res.render("error", { title: "Not found", user: req.user });
});

cacheService.init();

module.exports = app;