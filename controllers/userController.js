const Sentry = require('@sentry/node');

const createError = require("http-errors");
const Codes = require("../models/verificationCodes.js");
const Users = require("../models/users.js");

const bcrypt = require("bcrypt");
const cryptoRandomString = require("crypto-random-string");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const { body, validationResult } = require("express-validator");
const async = require("async");

const ObjectId = require("mongodb").ObjectID;
const i18next = require("i18next");

require("dotenv").config();

const formData = require('form-data');
const Mailgun = require('mailgun.js');
const mailgun = new Mailgun(formData);
const mg = mailgun.client({ username: 'api', key: process.env.API_KEY });

const userService = require("../services/userService");

// Login and signup
exports.getLoginPage = function(req, res, next) {
  return res.render('login', { title: i18next.t("common.login"), message: req.flash('message'), user: req.user });
};

exports.login = passport.authenticate('local', {
	successRedirect: '/',
	failureRedirect: '/login',
	failureFlash: true
});

exports.logout = function (req, res) {
	req.logout();
	req.session.destroy(function (err) {
		req.user=null
		res.clearCookie('connect.sid');
    res.redirect('/');
  });
};

exports.getSignupPage = function(req, res, next) {
  res.render('signup', { title: i18next.t("common.signup"), user: req.user });
};

exports.signup = [
	body('username')
		.notEmpty().withMessage("Username can't be empty")
		.matches(/^[A-Za-z0-9._-]+$/).withMessage('Username contains invalid characters'),
	body('password')
		.isLength({ min: 8 })
		.matches(/^[0-9a-zA-Z!@#$%^]+$/).withMessage('Password contains invalid characters'),
	body('username').escape(),
	body('password').escape(),
	async function(req, res, next) {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			res.render('signup', { title: 'Signup', user: req.user, errors: errors.array()});
			return;
		}

		let blacklist = ['card', 'user', 'cards', 'hiddenCards', 'login', 'logout', 'signup', 'collection', "image", "images", "character", "characters", "rankings", "surpriseguest", "userpage", "calculator"];
		if (blacklist.includes(req.body.username.toLowerCase())) {
			req.flash('message', 'Username invalid');
			res.render('signup', { title: 'Signup', user: req.user });
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
	}
];

exports.signupCheckUsername = async function (req, res) {
	let blacklist = ['card', 'user', 'cards', 'hiddenCards', 'login', 'logout', 'signup', 'collection'];
	if (blacklist.includes(req.body.username.toLowerCase())) {
		res.send(true);
		return;
	}
	try {
		var exists = await userService.getUser(req.body.username);
	} catch (e) {
		console.error(e);
		res.send('error');
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
			return next()
		}
		req.flash('message', 'You must be logged in');
		res.redirect('/login');
	}
};

exports.hasAccess = function(role) {
  return function(req, res, next) {
    var access = { "User": 0, "Moderator": 1, "Admin": 2 };
    if (req.user && access[req.user.type] >= access[role]) return next();
    return next(createError(404));
  }
}

exports.isSameUser = function() {
	return function (req, res, next) {
		if (req.user && (req.user.name == req.params.name || exports.hasAccess("Admin"))) {
			return next();
		}
		return next(createError(404, "Please log in and try again!"));
	}
};

exports.getOwnedCards = async function (req, res, next) {
	try {
		var ownedCards = await userService.getOwnedCards(req.user.name);
		ownedCards = ownedCards.map(card => card.uniqueName);
		res.send(ownedCards);
	} catch (e) {
		console.error(e)
		Sentry.captureException(e);
		return res.send([]);
	}
}

exports.modifyCollection = async function(req, res, callback) {
	try {
		var addedCards = [];
		var removedCards = [];

		for (let key in req.body.changedCards) {
			if (req.body.changedCards[key]) {
				addedCards.push(key);
			} else {
				removedCards.push(key);
			}
		}

		var collection = req.body.collection === "owned" ? "owned" : "faved";

		var result = await changeCardsInCollection(req.user.name, collection, addedCards, removedCards);

		if (!result.err) {
			return res.json({ err: false });
		} else {
			var e = new Error(result.err);
			e.clientMessage = "Something went wrong. Try refreshing the page";
			throw e;
		}
	} catch (e) {
		// console.error(e.message);
    Sentry.captureException(e);
		return res.json({ err: true, message: e.clientMessage ? e.clientMessage : e.message });
	}
};

function changeCardsInCollection(user, collection, addedCards, removedCards) {
	var addPipeline = { $addToSet: { } };
	addPipeline.$addToSet[`cards.${collection}`] = { $each: addedCards };

	var removePipeline = { $pullAll: { } };
	removePipeline.$pullAll[`cards.${collection}`] = removedCards;

	var addPromise = Users.findOneAndUpdate({"info.name": user}, addPipeline);
	var removePromise = Users.findOneAndUpdate({"info.name": user}, removePipeline);

	return Promise.all([addPromise, removePromise]).then(value => {
		return { err: false };
	}).catch(e => {
		return { err: true, message: e };
	});
};

exports.modifyCollectionFromDetails = async function(req, res) {
	try {
		var collection = req.body.collection === "owned" ? "owned" : "faved";
		var add = req.body.modify === "add";

		var addedCards = add ? [req.params.card] : [];
		var removedCards = !add ? [req.params.card] : [];

		var result = await changeCardsInCollection(req.user.name, collection, addedCards, removedCards);

		if (result.err) {
			var e = new Error(result.err);
			e.clientMessage = "Something went wrong. Try refreshing the page";
			throw e;
		}

		updateCountOnPage(res, req.params.card, collection);
	} catch (e) {
		console.error(e.message);
		return res.json({ err: true, message: e.clientMessage ? e.clientMessage : e.message });
	}
};

async function updateCountOnPage(res, card, collection) {
	try {
		var updatedVal = await exports.countCardInCollections(card, collection);
		var totalusers = await userService.getNumberOfUsers();

		return res.json({ err: false, message: "Collection updated!", updatedVal: (updatedVal/totalusers*100).toFixed(2) });
	} catch (e) {
		console.error(e.message);
		return res.json({ err: true, message: e.message });
	}
};


// Account management
exports.getAccountPage = function(req, res, next) {
  Users.find({ "info.name": req.user.name }, function(err, result) {
    if (err) { return next(err) }
    var u = result[0].info;
    u.profile = result[0].profile;

    if (!u.profile.joined) {
      u.profile.joined = Date();
    }

    if (!u.profile.display) {
      u.profile.display = "The_Mammon_Way";
    }

    if (!u.profile.isPrivate) {
      u.profile.isPrivate = false;
    }

    return res.render("account", { title: i18next.t("title.settings"), user: u });
  });
};

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

		var code = cryptoRandomString({length: 128, type: 'url-safe'});
		var record = new Codes({
			user: req.params.name,
			email: req.body.userData.email,
			code: code
		});

		await record.save();

    await mg.messages.create('karasu-os.com', {
      to: [req.body.userData.email],
      from: "Karasu OS <no-reply@karasu-os.com>",
      'h:Reply-To': 'karasu.os.mail@gmail.com',
      subject: i18next.t("settings.email_confirmation") + " - Karasu-OS.com",
      template: i18next.t("settings.email_template"),
      'h:X-Mailgun-Variables': JSON.stringify({ username: req.params.name, code: code })
    });

		return res.json({ err: false });
	} catch (e) {
    if (!["Email taken", "User not found", "Wrong password"].includes(e)) {
      Sentry.captureException(e);
    }

    return res.json({ err: true, message: e });
    // return res.json({ err: true, message: "An error occurred. We're trying to fix it!" });
	}
};

exports.verifyEmail = function(req, res, next) {
	Codes.findOneAndDelete({user: req.params.name, code: req.params.code}, (err, record) => {
		if (err) {
			return next(err);
		}
		if (!record) {
			var err = new Error('Invalid link');
			return next(err);
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
			var err = new Error('No such user');
			return res.json({ err: true, message: err.message });
		}
		bcrypt.compare(req.body.passwordData.old, user.info.password, function (err, result) {
			if (err) {
				return res.json({ err: true, message: err.message });
			}
			if (!result) {
				var err = new Error('Wrong password');
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
			var err = new Error('No account linked to this email');
			return res.json({ err: true, message: err.message });
		}
		var newPassword = cryptoRandomString({length: 8, type: 'alphanumeric'});

		mg.messages.create('karasu-os.com', {
      to: [req.body.email],
      from: "Karasu OS <no-reply@karasu-os.com>",
      'h:Reply-To': 'karasu.os.mail@gmail.com',
      subject: "Restore password",
      text: `${i18next.t("user.username")}: ${user.info.name}\n${i18next.t("user.password")}: ${newPassword}`
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

exports.updateSupport = function(req, res) {
  const user = req.body.supportstatus.user;
  const newstatus = req.body.supportstatus.newstatus;

  Users.updateOne({ "info.name": user }, { "info.supportStatus": newstatus }, function(err, result) {
    if (err) {
      Sentry.captureException(err);
      return res.json({ err: true, message: err });
    }

    if (result.nModified === 1) {
      return res.json({ err: null, message: user + "'s support status updated!"});
    } else {
      return res.json({ err: true, message: "Update failed. Refresh the page and try again." });
    }
  });
};


// Misc

exports.countCardInCollections = function(card, collection) {
	var targetCard = {};
	targetCard[`cards.${collection}`] = card;
	return Users.countDocuments(targetCard);
};

exports.getUserListPage = async function(req, res) {
  const page = req.query.page?req.query.page:1;
  const order = req.query.order?req.query.order:1;
  const limit = 50;

  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;

  var result = {};

  try {
    var sort = {};
    if (req.query.sortby && req.query.sortby !== '') {
      sort[`info.${req.query.sortby}`] = order;
    } else {
      sort = { "_id": order };
    }
    result.users = await Users.find({},"info").sort(sort).limit(limit).skip(startIndex);
    var totalusers = await userService.getNumberOfUsers();
  } catch(e) {
    return res.status(500).json({ message: e.message });
  }

  if (endIndex < totalusers) {
    result.nextpage = {
      page: page + 1
    };
  }

  if (startIndex > 0) {
    result.previouspage = {
      page: page - 1
    };
  }

  result.totalpage = Math.ceil(totalusers/limit);
  result.totalusers = totalusers;
  res.render('userpage', { title: 'User List', userList: result, user: req.user});
};

exports.getRankingsPage = async function(req, res, next) {
  try {
    var cards = await Users.aggregate([
      { $unwind: "$cards.faved" },
      { $group: { _id: "$cards.faved", total: { $sum: 1 } } },
      { $sort: { total: -1, _id: 1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: "cards",
          localField: "_id",
          foreignField: "uniqueName",
          as: "cardData"
        }
      },
      { $addFields: { name: { $arrayElemAt: ["$cardData", 0] } } },
      { $set: { name: "$name.name", ja_name: "$name.ja_name" } },
      { $unset: ["cardData"] }
    ]);
    res.render("rankings", { title: i18next.t("common.rankings"), description: "Ranking of most liked obey me cards.", ranking: cards, user: req.user });
  } catch (e) {
    return next(e);
  }
};

exports.updateUserProfile = function(req, res) {
  var update = {};
  for (const field in req.body.updatedInfo) {
    update[`profile.${field}`] = req.body.updatedInfo[field];
  }

  Users.updateOne(
    { "info.name": req.user.name },
    { $set: update },
    function(err, result) {
      if (err) {
        Sentry.captureException(err);
        return res.json({ err: true, message: "Something went wrong :(" });
      }

      if (result.nModified === 1) {
        return res.json({ err: null, message: "Updated!" });
      } else {
        return res.json({ err: true, message: "Something went wrong :(" });
      }
    }
  );
}

// exports.issueBan = async function(req, res) {
//   return res.json(await userService.banUser(req.body.name));
// }


// Authentication
passport.use(new LocalStrategy({ passReqToCallback : true },
	function(req, username, password, next) {
		Users.findOne({ "info.name": { $regex : new RegExp('^' + username + '$', "i") } }, function (err, user) {
			if (err) { return next(err) }
			if (!user) {
				return next(null, false, req.flash('message', 'No such user'))
			}
			bcrypt.compare(password, user.info.password, function (err, result) {
				if (err) { return next(err) }
				if (!result) {
          return next(null, false, req.flash('message', 'Wrong password'));
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
    var userInfo = user.info;
    userInfo.id = user._id;
    if (user.info.type === "Admin") {
    	userInfo.isAdmin = true;
    }
    next(err, userInfo);
  });
});