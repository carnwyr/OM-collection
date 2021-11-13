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

const eventsService = require("../services/eventsService");
const eventCalculatorService = require("../services/eventCalculatorService");
const cardsService = require("../services/cardService");

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
		var eventName = decodeURIComponent(req.params.event.replace(/_/g, ' '));
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
	} catch (e) {
		return next(e);
	}

	var settings = req.cookies.calculator ? JSON.parse(req.cookies.calculator) : "";
	// key: free battle/ap type; value: amount of free battles/ap
	// {
	//   adBattles: '2',			<-- 2 free battles
	//   denergy: '2'					<-- 2 d-energy, need to convert to battles
	//   adAP: '30',					<-- 30 free AP
	//   fridgeMission: '0',	<-- 0 free AP
	//   spg: '0',						...
	//   friends: '0',
	//   toDo: '0',
	//   other: '300',
	//   popquiz: true				<-- include pop quiz reward AP
	// }

	var locals = { title: i18next.t("title.calculator"), description: i18next.t("description.calculator"), event: event, query: req.query, user: req.user };
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

exports.getEventAddPage = async function (req, res, next) {
	try {
		var data = eventsService.getDefaultEventData();
		var cards = await cardsService.getCards();
		var cardNames = cards.map(x => x.name);
		var apPresets = await eventsService.getAPPresets();
		return res.render("eventEdit", { title: "Add Event", description: ":)", data: data, user: req.user, cardData: cardNames, apPresets: apPresets });
	} catch(e) {
		return next(e);
	}
};

exports.getEventEditPage = async function(req, res, next) {
	try {
		var eventName = decodeURIComponent(req.params.event.replace(/_/g, ' '));
		let data = await eventsService.getEvent(eventName);
		if (!data) throw createError(404, "Event not found");

		data.start = formatDateTime(data.start);
		data.end = formatDateTime(data.end);

		var cards = await cardsService.getCards();
		var cardNames = cards.map(x => x.name);

		var apPresets = await eventsService.getAPPresets();

		return res.render("eventEdit", { title: "Edit Event", description: ":)", data: data, user: req.user, cardData: cardNames, apPresets: apPresets });
	} catch(e) {
		return next(e);
	}
};

function formatDateTime(datetime) {
	return dayjs.tz(datetime, "UTC").format('YYYY.MM.DD, HH:mm:ss');
}
