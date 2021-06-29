var express = require('express');
var router = express.Router();

var eventsController = require('../controllers/eventsController');
const eventsService = require("../services/eventsService");  // (?)

// Calculate DP and AP needed for rewards
router.post('/:event/calculate', eventsController.calculate);

// Event page
router.get('/:event', eventsController.getEventPage);

router.get("/:event/edit", eventsController.getEventEditPage);

router.post('/updateEvent', eventsService.updateEvent);


module.exports = router;
