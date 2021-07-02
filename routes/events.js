var express = require("express");
var router = express.Router();

var eventsController = require("../controllers/eventsController");
const eventsService = require("../services/eventsService");  // (?)
const usersController = require("../controllers/usersController");

// Calculate DP and AP needed for rewards
router.post("/:event/calculate", eventsController.calculate);

// Event page
router.get("/:event", eventsController.getEventPage);

router.get("/:event/edit", usersController.hasAccess("Moderator"), eventsController.getEventEditPage);

router.post("/updateEvent", usersController.hasAccess("Moderator"), eventsService.updateEvent);

router.post("/:event/delete", usersController.hasAccess("Moderator"), eventsService.deleteEvent);


module.exports = router;
