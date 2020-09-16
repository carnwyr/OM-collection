var express = require('express');
var router = express.Router();

var usersController = require('../controllers/usersController');

// Account settings page
router.get('/:name', usersController.isSameUser(), usersController.accountPage);

module.exports = router;