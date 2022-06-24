const express = require("express");
const router = express.Router();

const cardsController = require("../controllers/cardsController");
const userController = require("../controllers/userController");
const miscController = require("../controllers/miscController");
const eventsController = require("../controllers/eventsController");
const loginController = require("../controllers/loginController");

// Static pages
router.get("/", cardsController.index);
router.get("/policies", miscController.privacyPolicy);
router.get("/surpriseGuest", miscController.surpriseGuest);
router.get("/rankings", userController.getRankingsPage);

// Cards lists
router.get("/cards", cardsController.getCardsListPage);
router.get("/hiddenCards", loginController.hasAccess("Admin"), cardsController.getHiddenCardsListPage);

// Events
router.get("/events", eventsController.getEventsPage);
router.get("/calculator/:type", eventsController.getCalculatorPage);

// Account management
router.get("/login", loginController.getLoginPage);
router.post("/login", loginController.login);
router.get("/logout", loginController.isLoggedIn(), loginController.logout);
router.get("/signup", loginController.getSignupPage);
router.post("/signup", loginController.signup);
router.post("/signup/checkUsername", loginController.signupCheckUsername);

// User's personal collection
router.get('/collection/getOwnedCards', loginController.isLoggedIn(), userController.getOwnedUniqueNames);
router.post('/collection/modifyCollection', loginController.isLoggedIn(), userController.modifyCollection);
router.get('/:username/collection', cardsController.getOwnedCardsPage);
router.get('/:username/favourites', cardsController.getFavouriteCardsPage);
router.get('/:username/profile', cardsController.getProfilePage);

// User Management
router.get("/userpage", loginController.hasAccess("Admin"), userController.getUserListPage);
router.post("/updateSupport", loginController.hasAccess("Admin"), userController.updateSupport);

// Misc.
router.get('/getCards', cardsController.getCards);
router.get("/animations", cardsController.getAnimationList);

router.post("/update_tree", loginController.isLoggedIn(), userController.updateUserTree);


module.exports = router;
