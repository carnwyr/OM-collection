var express = require('express');
var router = express.Router();

var cardsController = require('../controllers/cardsController');
var usersController = require('../controllers/usersController');

// Edit or add card
router.post('/updateCard', usersController.hasAccess("Admin"), cardsController.updateCard);

// Card creation page
router.get('/new', usersController.hasAccess("Admin"), cardsController.getEditCardPage);

// Collection management from card detail page
router.post('/:card/modifyCollectionFromDetails', usersController.isLoggedIn(), usersController.modifyCollectionFromDetails);

// Card edit page
router.get('/:card/edit', usersController.hasAccess("Admin"), cardsController.getEditCardPage);

// Make hidden card available to everyone
router.get('/:card/makePublic', usersController.hasAccess("Admin"), cardsController.makeCardPublic);

// Delete card
router.get('/:card/delete', usersController.hasAccess("Admin"), cardsController.deleteCard);

// Card detail page
router.get('/:card', cardsController.getCardDetailPage);


module.exports = router;
