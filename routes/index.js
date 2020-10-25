var express = require('express');
var router = express.Router();

var cardsController = require('../controllers/cardsController');
var usersController = require('../controllers/usersController');
var miscController = require('../controllers/miscController');

// Home page
router.get('/', cardsController.index);

// Privacy policy
router.get('/policies', miscController.privacyPolicy);

// Cards list
router.get('/cards', cardsController.cardsList);
router.get('/cards/view', cardsController.fullImgView);
router.get('/hiddenCards', usersController.isAdmin(), cardsController.hiddenCardsList);

// Account management
router.get('/login', usersController.loginGet);
router.post('/login', usersController.loginPost);
router.get('/logout', usersController.isLoggedIn(), usersController.logout);
router.get('/signup', usersController.signupGet);
router.post('/signup', usersController.signupPost);
router.post('/signup/checkUsername', usersController.signupCheckUsername);

// User's personal collection
router.get('/collection/getOwnedCards', usersController.isLoggedIn(), cardsController.getOwnedCards);
router.post('/collection/updateOwnedCards', usersController.isLoggedIn(), cardsController.updateOwnedCards);
router.get('/:username/collection', cardsController.cardsCollection);
router.post('/:username/getStatsImage', cardsController.getStatsImage);

module.exports = router;
