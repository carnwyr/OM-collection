const createError = require("http-errors");
const async = require("async");

const eventsService = require("../services/eventsService");
const eventCalculatorService = require("../services/eventCalculatorService");

exports.getEventsPage = async function(req, res, next) {
	// TODO: add method to only retrieve a certain type of event
	// TODO: format events to be { name: __, start: __, end:__ } and remove unused variables.
	var events = await eventsService.getEvents();

	return res.render("eventList", {
		title: "Events",
		description: "A list of Obey Me events, including Nightmare and Pop Quizzes.",
		user: req.user,
		events: events });
}

exports.getEventDetail = async function (req, res, next) {
	try {
		var eventName = req.params.event.replace(/_/g, ' ');
		var event = await eventsService.getEvent(eventName);

		if (!event) throw createError(404, "Event not found");
	} catch (e) {
		return next(e);
	}
	return res.render("eventDetail", {
		title: event.name,
		description: `View "${event.name}" and other Obey Me events on Karasu-OS.com`,
		event: event,
		user: req.user });
}

exports.getCalculatorPage = async function (req, res, next) {
	try {
		var event = await eventsService.getLatestEvent();
		//if (!event) throw createError(404, "No event data");
	} catch (e) {
		return next(e);
	}

	var locals = { title: "Pop Quiz Calculator", description: ":)", event: event, query: req.query, user: req.user };
	[locals.calculationError, locals.result] = eventCalculatorService.calculate(event, req.query);
	return res.render("calculator", locals);
};

exports.calculate = async function(req, res) {
	var eventName = req.params.event.replace(/_/g, ' ');
	var event = await eventsService.getEvent(eventName);

	if (!event) return res.json({ err: true });

	var result = eventCalculatorService.calculate(event, req.body.currentPoints, req.body.pointsPerBattle, req.body.isVip);
	return res.json({ err: false, result: result });
}

exports.getEventEditPage = async function(req, res, next) {
	if (req.params.event) {
		try {
			let data = await eventsService.getEvent(req.params.event);
			if (!data) throw createError(404, "Event not found");

			return res.render("eventEdit", { title: "Edit Event", description: ":)", data: data, user: req.user });
		} catch(e) {
			return next(e);
		}
	}
	return res.render("eventEdit", { title: "Add Event", description: ":)", data: {}, user: req.user });
};
