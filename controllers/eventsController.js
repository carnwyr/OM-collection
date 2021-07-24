const createError = require("http-errors");
const async = require("async");

const eventsService = require("../services/eventsService");
const eventCalculatorService = require("../services/eventCalculatorService");

exports.getEventsPage = async function(req, res, next) {
	var events = await eventsService.getEvents();
	res.render('events', {
		title: "Events",
		description: "A list of Obey Me events, including Nightmare and Pop Quizzes.",
		user: req.user,
		events: events });
}

exports.getEventPage = async function(req, res, next) {
	var eventName = req.params.event.replace(/_/g, ' ');
	var event = await eventsService.getEvent(eventName);

	if (!event) throw createError(404, "Event not found");

	return res.render('eventPage', {
		title: event.name,
		description: `View "${event.name}" and other Obey Me events on Karasu-OS.com`,
		event: event,
		user: req.user });
}

exports.calculate = async function(req, res) {
	var eventName = req.params.event.replace(/_/g, ' ');
	var event = await eventsService.getEvent(eventName);

	if (!event) return res.json({ err: true });

	var result = eventCalculatorService.calculate(event, req.body.currentPoints, req.body.pointsPerBattle, req.body.isVip);
	return res.json({ err: false, result: result });
}

const Events = require("../models/events");  // temp until todo in services/eventCacheService.js is complete

exports.getEventEditPage = async function(req, res, next) {
	if (req.params.event) {
		try {
			// let data = await eventsService.getEvent(req.params.event);
			let data = await Events.find({ name: req.params.event });  // temp, same reason as above
			if (data.length === 0) throw createError(404, "Event not found");

			console.log(data);

			return res.render("eventEdit", { title: "Edit Event", description: ":)", data: data[0], user: req.user });
		} catch(e) {
			return next(e);
		}
	}
	return res.render("eventEdit", { title: "Add Event", description: ":)", data: {}, user: req.user });
};