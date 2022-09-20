const express = require("express");
const router = express.Router();

const cardController = require("../controllers/cardsController");
const userController = require("../controllers/userController");
const miscController = require("../controllers/miscController");
const eventsController = require("../controllers/eventsController");
const loginController = require("../controllers/loginController");

// Static pages
router.get("/", cardController.index);
router.get("/policies", miscController.privacyPolicy);
router.get("/surpriseGuest", miscController.surpriseGuest);
router.get("/rankings", userController.getRankingsPage);
router.get("/icons/:character", cardController.getIconPage);
// router.get("/icons", cardController.getIconPage);

// Cards lists
router.get("/cards", cardController.getCardsListPage);
router.get("/hiddenCards", loginController.hasAccess("Admin"), cardController.getHiddenCardsListPage);

// Events
router.get("/events", eventsController.getEventsPage);
router.get("/calculator/:type", eventsController.getCalculatorPage);

// Account management
router.get("/login", loginController.getLoginPage);
router.post("/login", loginController.login);
router.get("/logout", loginController.isLoggedIn(), loginController.logout);
router.get("/signup", loginController.getSignupPage);
router.post("/signup", loginController.validateSignupInput, loginController.signup);
router.post("/signup/checkUsername", loginController.signupCheckUsername);

// User's personal collection
router.get('/collection/getOwnedCards', loginController.isLoggedIn(), userController.getOwnedUniqueNames);
router.post('/collection/submitCollectionChanges', loginController.isLoggedIn(), userController.submitCollectionChanges);
router.get('/:username/collection', cardController.getOwnedCardsPage);
router.get('/:username/favourites', cardController.getFavouriteCardsPage);
router.get('/:username/profile', cardController.getProfilePage);

// User Management
router.get("/userList", loginController.hasAccess("Admin"), userController.getUserListPage);
router.post("/updateSupport", loginController.hasAccess("Admin"), userController.updateSupport);

// Misc.
router.get('/getCards', cardController.getCards);
// router.get("/animations", cardController.getAnimationList);
router.get('/getTreeData', cardController.getTreeData);
router.get("/tree_tracker/rank_up", miscController.getTreeTracker);
router.get("/tree_tracker", miscController.getTreeTracker);

router.post("/update_tree", loginController.isLoggedIn(), userController.updateUserTree);


module.exports = router;
