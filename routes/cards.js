var express = require('express');
var router = express.Router();

var cardsController = require('../controllers/cardsController');
var usersController = require('../controllers/usersController');

// Personal collection management
router.post('/:id/addToCollection', usersController.isLoggedIn(), cardsController.cardAddToCollection);
router.post('/:id/removeFromCollection', usersController.isLoggedIn(), cardsController.cardRemoveFromCollection);

// Card detail page
router.get('/:id', cardsController.cardsDetail);

module.exports = router;