var express = require('express');
var router = express.Router();

var eventsController = require('../controllers/eventsController');

// Calculate DP and AP needed for rewards
router.post('/:event/calculate', eventsController.calculate);

// Event page
router.get('/:event', eventsController.getEventPage);

module.exports = router;