var express = require('express');
var router = express.Router();

var cardsController = require('../controllers/cardsController');
var usersController = require('../controllers/usersController');

// Personal collection management
router.post('/:id/addToCollection', usersController.isLoggedIn(), cardsController.addToCollection);
router.post('/:id/removeFromCollection', usersController.isLoggedIn(), cardsController.removeFromCollection);

// Card edit page
router.get('/:id/edit', usersController.isAdmin(), cardsController.editCardGet);

// Card detail page
router.get('/:id', cardsController.cardDetail);

module.exports = router;