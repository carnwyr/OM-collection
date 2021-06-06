const createError = require("http-errors");
const async = require("async");

const eventsService = require("../services/eventsService");
const eventCalculatorService = require("../services/eventCalculatorService");

exports.getEventsPage = async function(req, res, next) {
	// if (url is nightmare) then { var events = await eventsService.getEvents({ type: nightmare }); }
	var events = await eventsService.getEvents();
	res.render("eventGallery", {
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

	var result = eventCalculatorService.calculate(event, req.body.currentPoints, req.body.pointsPerBattle);
	return res.json({ err: false, result: result });
}
