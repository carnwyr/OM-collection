var express = require('express');
var router = express.Router();

var cardsController = require('../controllers/cardsController');
var usersController = require('../controllers/usersController');


/* Admin */

// Get card edit page
router.get('/new', usersController.hasAccess("Admin"), cardsController.getEditCardPage);
router.get('/:card/edit', usersController.hasAccess("Admin"), cardsController.getEditCardPage);

// Edit or add card
router.post('/new', usersController.hasAccess("Admin"), cardsController.addNewCard);
router.post('/:card/edit', usersController.hasAccess("Admin"), cardsController.updateCard);

// Make hidden card available to everyone
router.get('/:card/makePublic', usersController.hasAccess("Admin"), cardsController.makeCardPublic);

// Delete card
router.post('/delete', usersController.hasAccess("Admin"), cardsController.deleteCard);


/* General */

// "Add to/ remove from collection" on card detail page
router.post('/:card/modifyCollectionFromDetails', usersController.isLoggedIn(), usersController.modifyCollectionFromDetails);

// Get card detail page
router.get('/:card', cardsController.getCardDetailPage);


module.exports = router;
