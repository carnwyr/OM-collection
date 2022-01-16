var express = require("express");
var router = express.Router();

const eventsController = require("../controllers/eventsController");
const usersController = require("../controllers/usersController");

// Calculate DP and AP needed for rewards
router.post("/:event/calculate", eventsController.calculate);

// Event page
router.get("/new", usersController.hasAccess("Moderator"), eventsController.getEventAddPage);
router.post("/new", usersController.hasAccess("Moderator"), eventsController.addEvent);
router.get("/:event/edit", usersController.hasAccess("Moderator"), eventsController.getEventEditPage);
router.post("/:event/edit", usersController.hasAccess("Moderator"), eventsController.updateEvent);
router.post("/:event/delete", usersController.hasAccess("Moderator"), eventsController.deleteEvent);

// mod access only, until page is complete
router.get("/:event", eventsController.getEventDetail);


module.exports = router;
