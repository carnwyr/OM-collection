const async = require("async");

const eventsService = require("../services/eventsService");

var cachedEvent;

exports.init = async function () {
	cachedEvent = await eventsService.getLatestEventData();

	var changeStream = eventsService.getChangeStream();

	changeStream.on('change', async next => {
		cachedEvent = await eventsService.getLatestEventData();
	});
}

exports.setCachedEvent = function(event) {
	cachedEvent = event;
}

exports.getCachedEvent = function() {
	return cachedEvent;
}