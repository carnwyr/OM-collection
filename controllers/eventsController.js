const createError = require("http-errors");
const async = require("async");

const eventsService = require("../services/eventsService");
const eventCalculatorService = require("../services/eventCalculatorService");

exports.getEventsPage = async function(req, res, next) {
	// TODO: add method to only retrieve a certain type of event
	// TODO: format events to be { name: __, start: __, end:__ } and remove unused variables.
	var events = await eventsService.getEvents();

	// console.log(events);

	res.render('eventGallery', {
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

exports.getCalculatorPage = async function(req, res, next) {
	// find and get latest pop quiz event
	var ev = await eventsService.getEvent("Happy Birthday Luke");

	// console.log(req.query);
	// looks like this ↓
	// {
	//   pointsPerBattle: '120',
	//   currentPoints: '100',
	//   customGoal: '120',
	//   stagesCleared: '20'
	// }

	var locals = { title: "Pop Quiz Calculator", description: ":)", event: ev, query: req.query, user: req.user };

	/*
	 * Checks
	 * 1. pointsPerBattle and currentPoints exists
	 * 2. pointsPerBattle is larger than 120 (pop quiz) or 12 (birthday)
	 * 3. currentPoints is a possible value (i.e. 0 < value < a max threshold)
	 * 4. if customGoal has value, it also needs to be a reasonable value
	 * 5. add max cap to stop troll
	 */
	if (validateCalculationInput(req.query)) {
		locals.result = eventCalculatorService.calculate(ev, req.query);
	}

	return res.render("calculator", locals);
};

function validateCalculationInput(data) {
	var pointsPerBattle = parseInt(data.pointsPerBattle);
	var currentPoints = parseInt(data.currentPoints);

	if (!pointsPerBattle || !Number.isInteger(currentPoints)) return false;

	// 120 needs change
	if (pointsPerBattle < 120 || currentPoints < 0) return false;

	var customGoal = parseInt(data.customGoal);
	var stagesCleared = parseInt(data.stagesCleared);

	if (currentPoints > 5000000 || customGoal > 5000000) return false;

	// need to figure out max stages
	if (stagesCleared < 0 && stagesCleared > 20) return false;

	// more checks needed

	return true;
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
