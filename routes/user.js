var express = require('express');
var router = express.Router();

var usersController = require('../controllers/usersController');

// Restore password
router.post('/restorePassword', usersController.restorePassword);

// Email verification
router.post('/:name/sendVerificationEmail', usersController.isSameUser(), usersController.sendVerificationEmail);
router.get('/:name/confirmEmail/:code', usersController.isSameUser(), usersController.verifyEmail);

// Password change
router.post('/:name/changePassword', usersController.isSameUser(), usersController.changePassword);

// Account settings page
router.get('/', usersController.isSameUser(), usersController.getAccountPage);

// update profile
router.post('/:name/updateUserProfile', usersController.isSameUser(), usersController.updateUserProfile);


module.exports = router;
