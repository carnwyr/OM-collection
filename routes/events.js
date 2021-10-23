var express = require("express");
var router = express.Router();

var eventsController = require("../controllers/eventsController");
const eventsService = require("../services/eventsService");  // (?)
const usersController = require("../controllers/usersController");

// Calculate DP and AP needed for rewards
router.post("/:event/calculate", eventsController.calculate);

// Event page
router.get("/new", usersController.hasAccess("Moderator"), eventsController.getEventEditPage);
router.post("/new", usersController.hasAccess("Moderator"), eventsService.addEvent);
router.get("/:event/edit", usersController.hasAccess("Moderator"), eventsController.getEventEditPage);
router.post("/:event/edit", usersController.hasAccess("Moderator"), eventsService.updateEvent);
router.get("/:event/delete", usersController.hasAccess("Moderator"), eventsService.deleteEvent);

// mod access only, until page is complete
router.get("/:event", usersController.hasAccess("Moderator"), eventsController.getEventDetail);


module.exports = router;
