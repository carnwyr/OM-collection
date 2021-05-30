// TODO refresh curent event data if it's modified in db
const async = require("async");

const eventsService = require("../services/eventsService");

var cachedEvent;

exports.init = async function() {
	cachedEvent = await eventsService.getCurrentEvent();
}

exports.getCachedEvent = function(eventName) {
	if (cachedEvent && cachedEvent.name === eventName)
		return cachedEvent;
}