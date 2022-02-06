var express = require('express');
var router = express.Router();

var userController = require('../controllers/userController');

// Restore password
router.post('/restorePassword', userController.restorePassword);

// Email verification
router.post('/:name/sendVerificationEmail', userController.isSameUser(), userController.sendVerificationEmail);
router.get('/:name/confirmEmail/:code', userController.isSameUser(), userController.verifyEmail);

// Password change
router.post('/:name/changePassword', userController.isSameUser(), userController.changePassword);

// Account settings page
router.get('/', userController.isSameUser(), userController.getAccountPage);

// update profile
router.post('/:name/updateUserProfile', userController.isSameUser(), userController.updateUserProfile);


module.exports = router;
