var express = require('express');
var router = express.Router();

var cardsController = require('../controllers/cardsController');
var usersController = require('../controllers/usersController');
var miscController = require('../controllers/miscController');

// Statis pages
router.get('/', cardsController.index);
router.get('/policies', miscController.privacyPolicy);
router.get("/surpriseGuest", miscController.surpriseGuest);
router.get("/rankings", usersController.getRankingsPage);

// Cards list
router.get('/cards', cardsController.getCardsListPage);
router.get('/hiddenCards', usersController.isAdmin(), cardsController.getHiddenCardsListPage);

// Account management
router.get('/login', usersController.getLoginPage);
router.post('/login', usersController.login);
router.get('/logout', usersController.isLoggedIn(), usersController.logout);
router.get('/signup', usersController.getSignupPage);
router.post('/signup', usersController.signup);
router.post('/signup/checkUsername', usersController.signupCheckUsername);

// User's personal collection
router.get('/collection/getOwnedCards', usersController.isLoggedIn(), usersController.getOwnedCards);
router.post('/collection/modifyCollection', usersController.isLoggedIn(), usersController.modifyCollection);
router.get('/:username/collection', cardsController.getCardsCollectionPage);
router.post('/:username/getStatsImage', cardsController.getStatsImage);
router.get('/:username/favourites', cardsController.getFavouritesPage);

// User Management
router.get("/userpage", usersController.isAdmin(), usersController.getUserListPage);
router.post("/updateSupport", usersController.isAdmin(), usersController.updateSupport);


module.exports = router;
