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

// update profile
router.post('/:name/updateUserProfile', userController.isSameUser(), userController.updateUserProfile);

router.post("/issueBan", userController.hasAccess("Admin"), userController.banUser);

//
router.get("/tree_progress", userController.isSameUser(), userController.getTreeProgressPage);
router.get("/edits", userController.isSameUser(), userController.getUserSuggestionPage);

// Account settings page
router.get('/', userController.isSameUser(), userController.getAccountPage);


module.exports = router;
