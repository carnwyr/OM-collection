const async = require("async");

const eventsService = require("../services/eventsService");

var cachedEvent;

exports.init = async function () {
	cachedEvent = await eventsService.getCurrentEventData();

	var changeStream = eventsService.getChangeStream();

	changeStream.on('change', async next => {
		cachedEvent = await eventsService.getCurrentEventData();
	});
}

exports.setCachedEvent = function(event) {
	cachedEvent = event;
}

exports.getCachedEvent = function() {
	return cachedEvent;
}