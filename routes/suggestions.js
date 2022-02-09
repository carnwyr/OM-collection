var express = require("express");
var router = express.Router();

const userController = require("../controllers/userController");
const suggestionController = require("../controllers/suggestionController");

router.post("/add", userController.canEdit(), suggestionController.addSuggestion);
router.post("/refuse", userController.hasAccess("Admin"), suggestionController.refuseSuggestion);
router.post("/approve", userController.hasAccess("Admin"), suggestionController.approveSuggestion);

router.get("/:id", userController.hasAccess("Admin"), suggestionController.getSuggestionPage);
router.get("/", suggestionController.getSuggestionList);

module.exports = router;
