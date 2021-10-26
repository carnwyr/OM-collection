const Sentry = require('@sentry/node');
const async = require("async");
const dayjs = require('dayjs');
const i18next = require("i18next");
const createError = require("http-errors");

const customParseFormat = require('dayjs/plugin/customParseFormat')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')

dayjs.extend(customParseFormat)
dayjs.extend(utc)
dayjs.extend(timezone)

const Events = require("../models/events");
const APPresets = require("../models/apPresets");

const eventCacheService = require("../services/eventCacheService");
const fileService = require("../services/fileService");

exports.getEvents = async function(condition = {}) {
	try {
		return await Events.find(condition);
	} catch (e) {
		Sentry.captureException(e);
		console.error(e);
		return [];
	}
}

exports.getEvent = async function(eventName) {
	var event = eventCacheService.getCachedEvent();
	if (!event || eventName != event.name) {
		event = await getFullEventData(eventName);
	}
	return event;
}

exports.getLatestEvent = async function () {
	var latestEventName = await getLatestEventName();

	var cachedEvent = eventCacheService.getCachedEvent();
	if (cachedEvent && cachedEvent.name === latestEventName) {
		return cachedEvent;
	}

	try {
		var latestEventData = await getFullEventData(latestEventName);
		eventCacheService.setCachedEvent(latestEventData);
		return latestEventData;
	} catch (e) {
		console.error(e);
		Sentry.captureException(e);
	}
}

async function getLatestEventName() {
	var currentTime = new Date();
	try {
		var latestEvent = await Events.find({
			start: { "$lte": currentTime },
			type: { "$ne": "Nightmare" }
		}).sort({ end: -1 }).limit(1);
		if (!latestEvent[0] || !latestEvent[0].name) return;

		return latestEvent[0].name.en;
	} catch (e) {
		console.error(e);
		Sentry.captureException(e);
	}
}

exports.getLatestEventData = async function () {
	var latestEventName = await getLatestEventName();
	if (!latestEventName) return;

	var latestEventData = await getFullEventData(latestEventName);
	return latestEventData;
}

async function getFullEventData(eventName) {
	try {
		var event = await Events.aggregate([
			{ $match: { "name.en": eventName }},
			{
				$unwind: {
					"path": "$rewards",
					"preserveNullAndEmptyArrays": true
				}},
			{ $lookup: {
				from: "cards",
				localField: "rewards.card",
				foreignField: "name",
				as: "rewards.card"
			}},
			{ $unwind: { path: "$rewards.card", preserveNullAndEmptyArrays: true }},
			{ $project: {
				"rewards.card.attribute": 0,
				"rewards.card.type": 0,
				"rewards.card.rarity": 0,
				"rewards.card.characters": 0
			}},
			{
				$sort: {
					"rewards.points": -1,
					"rewards.card.number": -1
			}},
			{ $group: {
				_id: "$_id",
				temp: { "$first": "$$ROOT" },
				rewards: { "$push": "$rewards" }
			}},
			{ $replaceRoot: { "newRoot": { "$mergeObjects": ["$temp", { rewards: "$rewards" }]}}}
		]);

		return event?.length ? event[0] : null;
	} catch (e) {
		console.error(e);
		Sentry.captureException(e);
	}
}

exports.addEvent = async function (req, res) {
	try {
		let data = req.body.data;

		let event = await Events.findOne({ "name.en": data.name.en });
		if (event) {
			throw createError(400, `Event with name ${data.name.en} already exists`);
		}

		await Events.create(data);
		await fileService.saveImage(req.body.img, null, data.name.en, "events");
		return res.json({ err: null, message: "Event created!" });
	} catch(e) {
		console.error(e);
		Sentry.captureException(e);
		return res.json({ err: true, message: e.message });
	}
}

exports.updateEvent = async function (req, res) {
	try {
		let data = req.body.data;
		let eventName = decodeURIComponent(req.params.event.replace(/_/g, ' '));

		data.start = stringToDateTime(data.start);
		data.end = stringToDateTime(data.end);

		let event = await Events.findOne({ "name.en": eventName });

		if (!event) {
			throw createError(404, `Event with name ${data.name.en} doesn't exist`);
		}

		await Events.findOneAndUpdate({ "name.en": eventName }, data, { runValidators: true }).exec();
		await fileService.saveImage(req.body.img, eventName, data.name.en, "events");

		return res.json({ err: null, message: "Event updated!" });
	} catch(e) {
		console.error(e);
		Sentry.captureException(e);
		return res.json({ err: true, message: e.message });
	}
}

exports.deleteEvent = async function (req, res) {
	try {
		var eventName = decodeURIComponent(req.params.event.replace(/_/g, ' '));
		var event = await Events.findOneAndRemove({ "name.en": eventName });
		if (event) {
			await fileService.deleteImage("events", event.name.en);
		}
		return res.redirect('/events');
	} catch (err) {
		console.error(err);
		Sentry.captureException(err);
		return next(err);
	}
}

exports.getChangeStream = function() {
	return Events.watch();
}

exports.getDefaultEventData = function() {
	var start = dayjs.utc().startOf('day').hour(1);
	var end = dayjs.utc().startOf('day').hour(6);
	var data = {
		name: {},
		start: start,
		end: end,
		stages: 26,
		type: "Pop Quiz",
		pageCost: 100000
	};
	return data;
}

function stringToDateTime(dateString) {
	return dayjs.tz(dateString, 'YYYY.MM.DD, HH:mm:ss', "UTC");
}

exports.getAPPresets = async function () {
	var apPresets = await APPresets.find({});
	var apPresetsMap = {};
	apPresets.forEach(x => apPresetsMap[x.name] = x.rewards);
	return apPresetsMap;
}