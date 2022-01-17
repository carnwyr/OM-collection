const async = require("async");

const eventService = require("../services/eventService");

var cachedEvent;

exports.init = async function () {
	cachedEvent = await eventService.getLatestEventData();

	var changeStream = eventService.getChangeStream();

	changeStream.on('change', async next => {
		cachedEvent = await eventService.getLatestEventData();
	});
}

exports.setCachedEvent = function(event) {
	cachedEvent = event;
}

exports.getCachedEvent = function() {
	return cachedEvent;
}