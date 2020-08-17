var express = require('express');
var router = express.Router();

// Required controller modules
var cardsController = require('../controllers/cardsController');
var usersController = require('../controllers/usersController');

// GET colllection home page 
router.get('/', cardsController.index);

// GET request for list of all card items
router.get('/cards', cardsController.cardsList);

// GET request for login
router.get('/login', usersController.loginGet);

// POST request for login
router.post('/login', usersController.loginPost);

// GET request for logout
router.get('/logout', usersController.logout);

// GET request for signup
router.get('/signup', usersController.signupGet);

// POST request for signup
router.post('/signup', usersController.signupPost);

router.post('/signup/checkUsername', usersController.signupCheckUsername);

// GET request for personal cards collection
router.get('/collection', usersController.isLoggedIn(), cardsController.cardsCollection);

// GET request for list of owned cards
router.get('/collection/getOwnedCards', usersController.isLoggedIn(), cardsController.getOwnedCards);

// POST request for list of owned cards
router.post('/collection/updateOwnedCards', usersController.isLoggedIn(), cardsController.updateOwnedCards);

module.exports = router;