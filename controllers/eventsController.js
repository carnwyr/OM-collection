const createError = require("http-errors");
const Events = require("../models/events");

const async = require("async");

// Functions to render pages
exports.getEventsPage = function(req, res, next) {
	Events.find({}, function (err, eventsList) {
		if (err) { return next(err); }
		res.render('events', { title: "Events", description: "A list of Obey Me events, including Nightmare and Pop Quizzes.", user: req.user, events: eventsList });
	});
}

exports.getEventPage = async function(req, res, next) {
	try {
		var event = await Events.findOne({name: req.params.event.replace(/_/g, ' ')});
		if (!event) {
			throw createError(404, "Event not found");
		}
		return res.render('eventPage', {
				title: event.name,
				description: `View "${event.name}" and other Obey Me events on Karasu-OS.com`,
				event: event,
				user: req.user });
	} catch(e) {
		return next(e);
	}
}

exports.calculate = function(req, res, next) {
	var totalPoints = parseInt(req.body.totalPoints) || 0;
	var pointsPerBattle = parseInt(req.body.pointsPerBattle) || 0;
	return res.json({ err: false, result: `Do you really expect to get anything with ${totalPoints} points and ${pointsPerBattle} points per battle?` });
}