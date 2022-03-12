var express = require("express");
var router = express.Router();

var cardsController = require("../controllers/cardsController");
var userController = require("../controllers/userController");
var miscController = require("../controllers/miscController");
var eventsController = require("../controllers/eventsController");

// Static pages
router.get("/", cardsController.index);
router.get("/policies", miscController.privacyPolicy);
router.get("/surpriseGuest", miscController.surpriseGuest);
router.get("/rankings", userController.getRankingsPage);

// Cards lists
router.get("/cards", cardsController.getCardsListPage);
router.get("/hiddenCards", userController.hasAccess("Admin"), cardsController.getHiddenCardsListPage);

// Events
router.get("/events", eventsController.getEventsPage);
// router.get("/calculator", eventsController.getCalculatorPage);

// Account management
router.get("/login", userController.getLoginPage);
router.post("/login", userController.login);
router.get("/logout", userController.isLoggedIn(), userController.logout);
router.get("/signup", userController.getSignupPage);
router.post("/signup", userController.signup);
router.post("/signup/checkUsername", userController.signupCheckUsername);

// User's personal collection
router.get('/collection/getOwnedCards', userController.isLoggedIn(), userController.getOwnedCards);
router.post('/collection/modifyCollection', userController.isLoggedIn(), userController.modifyCollection);
router.get('/:username/collection', cardsController.getOwnedCardsPage);
router.get('/:username/favourites', cardsController.getFavouriteCardsPage);
router.get('/:username/profile', cardsController.getProfilePage);

// User Management
router.get("/userpage", userController.hasAccess("Admin"), userController.getUserListPage);
router.post("/updateSupport", userController.hasAccess("Admin"), userController.updateSupport);

// Misc.
router.get('/getCards', cardsController.getCards);

// TEMP: calculator
router.get('/calculator', miscController.calculator);


module.exports = router;
