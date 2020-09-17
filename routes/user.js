var express = require('express');
var router = express.Router();

var usersController = require('../controllers/usersController');

// Email verification
router.get('/:name/sendVerificationEmail', usersController.isSameUser(), usersController.sendVerificationEmail);
router.get('/:name/confirmEmail/:code', usersController.isSameUser(), usersController.verifyEmail);

// Account settings page
router.get('/:name', usersController.isSameUser(), usersController.accountPage);

module.exports = router;