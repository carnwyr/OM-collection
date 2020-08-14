var express = require('express');
var router = express.Router();
const multer  = require("multer");

const upload = multer({dest:"uploads"});

// Required controller modules
var cardsController = require('../controllers/cardsController');
var usersController = require('../controllers/usersController');

/// CARDS ROUTES ///

// GET request for creating a card. NOTE This must come before routes that display a card (uses id)
router.get('/create', cardsController.cardsCreateGet); //isAdmin

// POST request for creating card
router.post('/create', upload.single("cardsData"), cardsController.cardsCreatePost); //isAdmin

router.post('/:id/addToCollection', usersController.isLoggedIn(), cardsController.cardAddToCollection);
router.post('/:id/removeFromCollection', usersController.isLoggedIn(), cardsController.cardRemoveFromCollection);

// GET request to delete card
router.get('/:id/delete', cardsController.cardsDeleteGet);

// POST request to delete card
router.post('/:id/delete', cardsController.cardsDeletePost);

// GET request to update card
router.get('/:id/update', cardsController.cardsUpdateGet);

// POST request to update card
router.post('/:id/update', cardsController.cardsUpdatePost);

// GET request for one card
router.get('/:id', cardsController.cardsDetail);

module.exports = router;