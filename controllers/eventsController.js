const createError = require("http-errors");
const async = require("async");
const i18next = require("i18next");
const dayjs = require("dayjs");

const customParseFormat = require('dayjs/plugin/customParseFormat')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')

dayjs.extend(customParseFormat)
dayjs.extend(utc)
dayjs.extend(timezone)

const eventService = require("../services/eventService");
const eventCalculatorService = require("../services/eventCalculatorService");
const cardService = require("../services/cardService");

exports.getEventsPage = async function(req, res, next) {
	// TODO: add method to only retrieve a certain type of event
	// TODO: format events to be { name: __, start: __, end:__ } and remove unused variables.
	var events = await eventService.getEvents();

	return res.render("eventList", {
		title: "Events",
		description: "A list of Obey Me events, including Nightmare and Pop Quizzes.",
		user: req.user,
		events: events });
}

exports.getEventDetail = async function (req, res, next) {
	try {
		var eventName = decodeURIComponent(req.params.event.replace(/_/g, ' '));
		var event = await eventService.getEvent(eventName);

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
		var event = await eventService.getLatestEvent();
	} catch (e) {
		return next(e);
	}

	var cookieData = req.cookies.calculator ? JSON.parse(req.cookies.calculator) : {};
	var reqData = req.query;
	reqData.advanced = cookieData;
	var locals = { title: i18next.t("title.calculator"), description: i18next.t("description.calculator"), event: event, query: req.query, user: req.user };
	[locals.calculationError, locals.result] = eventCalculatorService.calculate(event, reqData);
	return res.render("calculator", locals);
};

exports.calculate = async function(req, res) {
	var eventName = req.params.event.replace(/_/g, ' ');
	var event = await eventService.getEvent(eventName);

	if (!event) return res.json({ err: true });

	var result = eventCalculatorService.calculate(event, req.body.currentPoints, req.body.pointsPerBattle, req.body.isVip);
	return res.json({ err: false, result: result });
}

exports.getEventAddPage = async function (req, res, next) {
	try {
		var data = eventService.getDefaultEventData();
		var cards = await cardService.getCards();
		var cardNames = cards.map(x => x.name);
		var apPresets = await eventService.getAPPresets();
		return res.render("eventEdit", { title: "Add Event", description: ":)", data: data, user: req.user, cardData: cardNames, apPresets: apPresets });
	} catch(e) {
		return next(e);
	}
};

exports.addEvent = async function(req, res) {
	try {
		var result = await eventService.addEvent(req.body.data, req.body.img);
		return res.json(result);
	} catch(e) {
		return res.json({ err: true, message: e.message });
	}
}

exports.deleteEvent = async function (req, res, next) {
	try {
		var eventName = decodeURIComponent(req.params.event.replace(/_/g, ' '));
		return res.json(await eventService.deleteEvent(eventName));
	} catch (err) {
		Sentry.captureException(err);
		return res.json({ err: true, message: err.message });
	}
}

exports.updateEvent = async function (req, res) {
	try {
		let eventName = decodeURIComponent(req.params.event.replace(/_/g, ' '));
		let result = await eventService.updateEvent(eventName, req.body.data, req.body.img);
		return res.json(result);
	} catch(e) {
		Sentry.captureException(e);
		return res.json({ err: true, message: e.message });
	}
}

exports.getEventEditPage = async function(req, res, next) {
	try {
		var eventName = decodeURIComponent(req.params.event.replace(/_/g, ' '));
		let data = await eventService.getEvent(eventName);
		if (!data) throw createError(404, "Event not found");

		data.start = formatDateTime(data.start);
		data.end = formatDateTime(data.end);

		var cards = await cardService.getCards();
		var cardNames = cards.map(x => x.name);

		var apPresets = await eventService.getAPPresets();

		return res.render("eventEdit", { title: "Edit Event", description: ":)", data: data, user: req.user, cardData: cardNames, apPresets: apPresets });
	} catch(e) {
		return next(e);
	}
};

function formatDateTime(datetime) {
	return dayjs.tz(datetime, "UTC").format('YYYY.MM.DD, HH:mm:ss');
}
