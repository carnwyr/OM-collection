const Sentry = require("@sentry/node");
const createError = require("http-errors");

// TODO: fix structure
const Codes = require("../models/verificationCodes.js");
const Users = require("../models/users.js");

const bcrypt = require("bcrypt");
const cryptoRandomString = require("crypto-random-string");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const { body, validationResult } = require("express-validator");
const async = require("async");

require("dotenv").config();

const formData = require("form-data");
const Mailgun = require("mailgun.js");
const mailgun = new Mailgun(formData);
const mg = mailgun.client({ username: "api", key: process.env.API_KEY });

const userService = require("../services/userService");


// Login and signup
exports.getLoginPage = function(req, res, next) {
	return res.render("login", { title: req.i18n.t("common.login"), message: req.flash("message"), user: req.user });
};

exports.login = passport.authenticate("local", {
	successRedirect: "/",
	failureRedirect: "/login",
	failureFlash: true
});

exports.logout = function (req, res) {
	req.logout();
	req.session.destroy(function (err) {
		req.user=null;
		res.clearCookie("connect.sid");
		res.redirect("/");
	});
};

exports.getSignupPage = function(req, res, next) {
	res.render("signup", { title: req.i18n.t("common.signup"), user: req.user });
};

exports.validateSignupInput = async (req, res, next) => {
	const validations = [
		body("username")
			.notEmpty().withMessage("Username can't be empty")
			.matches(/^[A-Za-z0-9._-]+$/).withMessage("Username contains invalid characters"),
		body("password")
			.isLength({ min: 8 })
			.matches(/^[0-9a-zA-Z!@#$%^]+$/).withMessage("Password contains invalid characters"),
		body("username").escape(),
		body("password").escape()
	];

	await Promise.all(validations.map(validation => validation.run(req)));

	const errors = validationResult(req);
	if (errors.isEmpty()) {
		return next();
	}

	return next(errors.array());
};

exports.signup = async (req, res, next) => {

	let blacklist = ["card", "user", "cards", "hiddenCards", "login", "logout", "signup", "collection", "image", "images", "character", "characters", "rankings", "surpriseguest", "userpage", "calculator"];
	if (blacklist.includes(req.body.username.toLowerCase())) {
		req.flash("message", "Username invalid");
		res.render("signup", { title: "Signup", user: req.user });
		return;
	}
	try {
		var  exists = await userService.getUser(req.body.username);
	} catch (e) {
		return next(e);
	}

	if (exists) {
		req.flash("message", "Username taken");
		res.render("signup", { title: "Signup", user: req.user });
	} else {
		bcrypt.genSalt(Number.parseInt(process.env.SALT_ROUNDS), (err, salt) => {
			if (err) return next(err);
			bcrypt.hash(req.body.password, salt, function(err, hash) {
				if (err) return next(err);
				var user = new Users({
					info: {
						name: req.body.username,
						password: hash,
						type: "User"
					}
				});
				user.save(function(err) {
					if (err) return next(err);
					req.login(user, function(err) {
						if (err) return next(err);
						res.redirect("/");
					});
				});
			});
		});
	}
};

exports.signupCheckUsername = async function (req, res) {
	let blacklist = ["card", "user", "cards", "hiddenCards", "login", "logout", "signup", "collection"];
	if (blacklist.includes(req.body.username.toLowerCase())) {
		res.send(true);
		return;
	}
	try {
		var exists = await userService.getUser(req.body.username);
	} catch (e) {
		console.error(e);
		res.send("error");
		return;
	}

	if (!exists) {
		res.send(false);
		return;
	}
	res.send(true);
};


// User checks
exports.isLoggedIn = function() {
	return function (req, res, next) {
		if (req.isAuthenticated()) {
			return next();
		}
		req.flash("message", "You must be logged in");
		res.redirect("/login");
	};
};

exports.hasAccess = function(role) {
	return function(req, res, next) {
		var access = { "User": 0, "Moderator": 1, "Admin": 2 };
		if (req.user && access[req.user.type] >= access[role]) return next();
		return next(createError(404));
	};
};

exports.isSameUser = function() {
	return function (req, res, next) {
		if (req.user && (req.user.name == req.params.name || exports.hasAccess("Admin"))) {
			return next();
		}
		res.redirect("/login");
	};
};

exports.canEdit = function(type = "regular") {
	return function(req, res, next) {
		if (!req.user || req.user.supportStatus.some(badge => badge.name === "bannedFromMakingSuggestions") ||
(type === "trusted" && (req.user.type !== "Admin" && !req.user.supportStatus.some(badge => badge.name === "trustedContributor")))) {
			return next(createError(401, properties = { errorMessage: "Please log in to access this page." }));
		}
		return next();
	};
};


// Management
exports.sendVerificationEmail = async function(req, res, next) {
	try {
		var userWithEmail = await Users.findOne({"info.email": req.body.userData.email});
		if (userWithEmail) {
			throw "Email taken";
		}

		var user = await Users.findOne({ "info.name": req.params.name });
		if (!user) {
			throw "User not found";
		}

		var correctPassword = await bcrypt.compare(req.body.userData.password, user.info.password);
		if (!correctPassword) {
			throw "Wrong password";
		}

		await Codes.deleteMany({user: req.params.name});

		var code = cryptoRandomString({length: 128, type: "url-safe"});
		var record = new Codes({
			user: req.params.name,
			email: req.body.userData.email,
			code: code
		});

		await record.save();

		await mg.messages.create("karasu-os.com", {
			to: [req.body.userData.email],
			from: "Karasu OS <no-reply@karasu-os.com>",
			"h:Reply-To": "karasu.os.mail@gmail.com",
			subject: req.i18n.t("settings.email_confirmation") + " - Karasu-OS.com",
			template: req.i18n.t("settings.email_template"),
			"h:X-Mailgun-Variables": JSON.stringify({ username: req.params.name, code: code })
		});

		return res.json({ err: false });
	} catch (e) {
		if (!["Email taken", "User not found", "Wrong password"].includes(e)) {
			Sentry.captureException(e);
		}

		return res.json({ err: true, message: e });
	}
};

exports.verifyEmail = function(req, res, next) {
	Codes.findOneAndDelete({user: req.params.name, code: req.params.code}, (err, record) => {
		if (err) {
			return next(err);
		}
		if (!record) {
			return next(createError(404, properties = { errorMessage: "Invalid link." }));
		}
		var setEmail = Users.updateOne({"info.name": req.user.name}, {"info.email": record.email}, (err) => {
			if (err) {
				return next(err);
			}
			res.redirect("/user");
		});
	});
};

exports.changePassword = function(req, res, next) {
	Users.findOne({ "info.name": req.params.name }, function (err, user) {
		if (err) {
			return res.json({ err: true, message: err.message });
		}
		if (!user) {
			var err = new Error("No such user");
			return res.json({ err: true, message: err.message });
		}
		bcrypt.compare(req.body.passwordData.old, user.info.password, function (err, result) {
			if (err) {
				return res.json({ err: true, message: err.message });
			}
			if (!result) {
				var err = new Error("Wrong password");
				return res.json({ err: true, message: err.message });
			}
			bcrypt.genSalt(Number.parseInt(process.env.SALT_ROUNDS), (err, salt) => {
				if (err) {
					return res.json({ err: true, message: err.message });
				}
				bcrypt.hash(req.body.passwordData.new, salt, function (err, hash) {
					if (err) {
						return res.json({ err: true, message: err.message });
					}
					var setPassword = Users.updateOne({"info.name": req.params.name}, {"info.password": hash}, (err) => {
						if (err) {
							return res.json({ err: true, message: err.message });
						}
						return res.json({ err: false });
					});
				});
			});
		});
	});
};

exports.restorePassword = function(req, res, next) {
	Users.findOne({ "info.email": req.body.email }, async function (err, user) {
		if (err) {
			return res.json({ err: true, message: err.message });
		}
		if (!user) {
			var err = new Error("No account linked to this email");
			return res.json({ err: true, message: err.message });
		}
		var newPassword = cryptoRandomString({length: 8, type: "alphanumeric"});

		mg.messages.create("karasu-os.com", {
			to: [req.body.email],
			from: "Karasu OS <no-reply@karasu-os.com>",
			"h:Reply-To": "karasu.os.mail@gmail.com",
			subject: "Restore password",
			text: `${req.i18n.t("user.username")}: ${user.info.name}\n${req.i18n.t("user.password")}: ${newPassword}`
		})
			.then(result => {
				bcrypt.genSalt(Number.parseInt(process.env.SALT_ROUNDS), (err, salt) => {
					if (err) {
						return res.json({ err: true, message: err.message });
					}
					bcrypt.hash(newPassword, salt, function (err, hash) {
						if (err) {
							return res.json({ err: true, message: err.message });
						}
						var setPassword = Users.updateOne({"info.name": user.info.name}, {"info.password": hash}, (err) => {
							if (err) {
								return res.json({ err: true, message: err.message });
							}
							return res.json({ err: false });
						});
					});
				});
			})
			.catch(err => { return res.json({ err: true, message: err.message });});
	});
};


// Authentication
passport.use(new LocalStrategy({ passReqToCallback : true },
	function(req, username, password, next) {
		Users.findOne({ "info.name": { $regex : new RegExp("^" + username + "$", "i") } }, function (err, user) {
			if (err) { return next(err); }
			if (!user) {
				return next(null, false, req.flash("message", "No such user"));
			}
			bcrypt.compare(password, user.info.password, function (err, result) {
				if (err) { return next(err); }
				if (!result) {
					return next(null, false, req.flash("message", "Wrong password"));
				} else {
					var userInfo = user.info;
					userInfo.id = user.id;
					return next(null, userInfo);
				}
			});
		});
	}
));

passport.serializeUser(function(user, next) {
	next(null, user.id);
});

passport.deserializeUser(function(id, next) {
	Users.findById(id, function(err, user) {
		if (err) return next(err);
		if (!user) return next(null, false);
		let userInfo = user.info;
		userInfo.id = user._id;
		if (user.info.type === "Admin") {
			userInfo.isAdmin = true;
		}
		if (userInfo.supportStatus && userInfo.supportStatus.length > 0) {
			userInfo.isSupporter = userInfo.supportStatus.some(badge => badge.name === "adfree");
		}
		return next(err, userInfo);
	});
});
