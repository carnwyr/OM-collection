var express = require('express');
var router = express.Router();

var cardsController = require('../controllers/cardsController');
var usersController = require('../controllers/usersController');

// Edit or add card
router.post('/updateCard', usersController.isAdmin(), cardsController.updateCard);

// Card creation page
router.get('/new', usersController.isAdmin(), cardsController.editCard);

// Personal collection management
router.post('/:id/addToCollection', usersController.isLoggedIn(), cardsController.addToCollection);
router.post('/:id/removeFromCollection', usersController.isLoggedIn(), cardsController.removeFromCollection);

// Card edit page
router.get('/:id/edit', usersController.isAdmin(), cardsController.editCard);

// Make hidden card available to everyone
router.get('/:id/makePublic', usersController.isAdmin(), cardsController.makeCardPublic);

// Delete card
router.get('/:id/delete', usersController.isAdmin(), cardsController.deleteCard);

// Card detail page
router.get('/:id', cardsController.cardDetail);

module.exports = router;
