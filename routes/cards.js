var express = require('express');
var router = express.Router();

var cardsController = require('../controllers/cardsController');
var userController = require('../controllers/userController');


/* Admin */

// Get card edit page
router.get('/new', userController.hasAccess("Admin"), cardsController.getEditCardPage);
router.get('/:card/edit', userController.canEdit(), cardsController.getEditCardPage);

// Edit or add card
router.post('/new', userController.hasAccess("Admin"), cardsController.addNewCard);
router.post('/:card/edit', userController.hasAccess("Admin"), cardsController.updateCard);

// Make hidden card available to everyone
router.get('/:card/makePublic', userController.hasAccess("Admin"), cardsController.makeCardPublic);

// Delete card
router.post('/delete', userController.hasAccess("Admin"), cardsController.deleteCard);


/* General */

// "Add to/ remove from collection" on card detail page
router.post('/:card/modifyCollectionFromDetails', userController.isLoggedIn(), userController.modifyCollectionFromDetails);

// Get card detail page
router.get('/:card', cardsController.getCardDetailPage);


module.exports = router;
