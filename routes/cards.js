var express = require('express');
var router = express.Router();

var cardsController = require('../controllers/cardsController');
var usersController = require('../controllers/usersController');

// Edit or add card
router.post('/updateCard', usersController.isAdmin(), cardsController.updateCard);

// Personal collection management
router.post('/:id/addToCollection', usersController.isLoggedIn(), cardsController.addToCollection);
router.post('/:id/removeFromCollection', usersController.isLoggedIn(), cardsController.removeFromCollection);

// Card edit page
router.get('/:id/edit', usersController.isAdmin(), cardsController.editCard);

// Card detail page
router.get('/:id', cardsController.cardDetail);

module.exports = router;