const Users = require('../models/users.js')

const bcrypt = require('bcrypt')
const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy
const { body, validationResult } = require('express-validator');
const async = require('async');
require('dotenv').config();

exports.loginGet = function(req, res, next) {
  res.render('login', { title: 'Login', message: req.flash('message'), user: req.user });
};

exports.loginPost = passport.authenticate('local',{ 
	successRedirect: '/',
	failureRedirect: '/login',
	failureFlash: true
});

exports.logout = function(req, res) {     
  req.session.destroy(function (err) {
  	res.redirect('/');
  });
};

exports.signupGet = function(req, res, next) {
  res.render('signup', { title: 'Signup', user: req.user });
};

exports.signupPost = [
	body('username')
		.notEmpty().withMessage("Username can't be empty")
		.matches(/^[A-Za-z0-9._-]+$/).withMessage('Username contains invalid characters'),
	body('password')
		.isLength({ min: 8 }),
	body('username').escape(),
	body('password').escape(),
	async function(req, res, next) {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			res.render('signup', { title: 'Signup', user: req.user, errors: errors.array()});
			return;
		}

		var [err, exists] = await userExists(req.body.username);
		if (err) { return next(err); }
			
		if (exists) {
			req.flash('message', 'Username taken')
			res.render('signup', { title: 'Signup', user: req.user });
		}
		else {
			bcrypt.genSalt(12, (err, salt) => {
				if (err) { return next(err); }
				bcrypt.hash(req.body.password, salt, function (err, hash) {
					if (err) { return next(err); }
					var user = new Users({
						name: req.body.username,
						password: hash,
						isAdmin: false
					});
					user.save(function (err) {
						if (err) {return next(err); }
						req.login(user, function(err) {
							if (err) { return next(err); }
							res.redirect('/');
						});
					});
				});
			});
		}
	}
];

async function userExists(username) {
	var userQuery = Users.findOne({ 'name': { $regex : new RegExp('^' + username + '$', "i") } });
	try {
		var user = await userQuery.exec();
	} catch(err) {
		return [err, null];
	}
	return [null, user ? true : false];
}

exports.signupCheckUsername = async function(req, res) {
	var [err, exists] = await userExists(req.body.username);
	if (err) { res.send('error'); return; }
	if (!exists) {
		res.send(false);
	}
	res.send(true);
}

exports.isLoggedIn = function () {
	return function (req, res, next) {
		if (req.isAuthenticated()) {
			return next()
		}
		req.flash('message', 'You must be logged in');
		res.redirect('/login');
	}
}

passport.use(new LocalStrategy({ passReqToCallback : true },
	function(req, username, password, next) {
		Users.findOne({ 'name': { $regex : new RegExp('^' + username + '$', "i") }}, function (err, user) {
			if (err) { return next(err) }
			if (!user) {
				return next(null, false, req.flash('message', 'No such user'))
			}
			bcrypt.compare(password, user.password, function (err, result) {
				if (err) { return next(err) }
				if (!result)
					return next(null, false, req.flash('message', 'Wrong password'))
				else
					return next(null, user)
			});
		})
	}
))

passport.serializeUser(function(user, next) {
  next(null, user.id);
});

passport.deserializeUser(function(id, next) {
  Users.findById(id, function(err, user) {
	next(err, user);
  });
});