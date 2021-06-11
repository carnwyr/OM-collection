var express = require('express');
var router = express.Router();

var cardsController = require('../controllers/cardsController');
var usersController = require('../controllers/usersController');

// Edit or add card
router.post('/updateCard', usersController.isAdmin(), cardsController.updateCard);

// Card creation page
router.get('/new', usersController.isAdmin(), cardsController.getEditCardPage);

// Collection management from card detail page
router.post('/:card/modifyCollectionFromDetails', usersController.isLoggedIn(), usersController.modifyCollectionFromDetails);

// Card edit page
router.get('/:card/edit', usersController.isAdmin(), cardsController.getEditCardPage);

// Make hidden card available to everyone
router.get('/:card/makePublic', usersController.isAdmin(), cardsController.makeCardPublic);

// Delete card
router.get('/:card/delete', usersController.isAdmin(), cardsController.deleteCard);

// Card detail page
router.get('/:card', cardsController.getCardDetailPage);


module.exports = router;
