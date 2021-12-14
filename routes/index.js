var express = require("express");
var router = express.Router();

var cardsController = require("../controllers/cardsController");
var usersController = require("../controllers/usersController");
var miscController = require("../controllers/miscController");
// var eventsController = require("../controllers/eventsController");

// Static pages
router.get("/", cardsController.index);
router.get("/policies", miscController.privacyPolicy);
router.get("/surpriseGuest", miscController.surpriseGuest);
router.get("/rankings", usersController.getRankingsPage);

// Cards lists
router.get("/cards", cardsController.getCardsListPage);
router.get("/hiddenCards", usersController.hasAccess("Admin"), cardsController.getHiddenCardsListPage);

// Events
// available to moderators only, until all event pages are completely finished
// router.get("/events", usersController.hasAccess("Moderator"), eventsController.getEventsPage);
// router.get("/calculator", eventsController.getCalculatorPage);

// Account management
router.get("/login", usersController.getLoginPage);
router.post("/login", usersController.login);
router.get("/logout", usersController.isLoggedIn(), usersController.logout);
router.get("/signup", usersController.getSignupPage);
router.post("/signup", usersController.signup);
router.post("/signup/checkUsername", usersController.signupCheckUsername);

// User's personal collection
router.get('/collection/getOwnedCards', usersController.isLoggedIn(), usersController.getOwnedCards);
router.post('/collection/modifyCollection', usersController.isLoggedIn(), usersController.modifyCollection);
router.get('/:username/collection', cardsController.getOwnedCardsPage);
router.post('/:username/getStatsImage', cardsController.getStatsImage);
router.get('/:username/favourites', cardsController.getFavouriteCardsPage);
router.get('/:username/profile', cardsController.getProfilePage);

// User Management
router.get("/userpage", usersController.hasAccess("Admin"), usersController.getUserListPage);
router.post("/updateSupport", usersController.hasAccess("Admin"), usersController.updateSupport);

// Misc.
router.get('/getAllCards', cardsController.getAvailableCards);

// TEMP: calculator
router.get('/calculator', miscController.calculator);


module.exports = router;
