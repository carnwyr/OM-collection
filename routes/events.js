var express = require("express");
var router = express.Router();

const eventsController = require("../controllers/eventsController");
const userController = require("../controllers/userController");

// Calculate DP and AP needed for rewards
// router.post("/:event/calculate", eventsController.calculate);

// Event page
router.get("/new", userController.hasAccess("Moderator"), eventsController.getEventAddPage);
router.get("/:event/edit", userController.canEdit(), eventsController.getEventEditPage);

router.post("/new", userController.hasAccess("Moderator"), eventsController.addEvent);
router.post("/:event/edit", userController.hasAccess("Moderator"), eventsController.updateEvent);
router.post("/:event/delete", userController.hasAccess("Moderator"), eventsController.deleteEvent);

router.get("/:event", eventsController.getEventDetail);


module.exports = router;
