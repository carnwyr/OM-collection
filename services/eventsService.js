const Sentry = require('@sentry/node');
const async = require("async");

const Events = require("../models/events");

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
	var event = eventCacheService.getCachedEvent(eventName);
	if (!event)
		event = await getFullEventData(eventName);
	return event;
}

exports.getLatestEvent = async function() {
	var currentTime = new Date();
	var cachedEvent = eventCacheService.getCachedEvent();
	if (cachedEvent && cachedEvent.start < currentTime) {
		return cachedEvent;
	}

	try {
		var latestEventData = await exports.getLatestEventData();
		eventCacheService.setCachedEvent(latestEventData);
		return latestEventData;
	} catch (e) {
		console.error(e);
		Sentry.captureException(e);
	}
}

exports.getCurrentEventData = async function() {
	var currentTime = new Date();
	try {
		var currentEventName = await Events.findOne({ start: { "$lte": currentTime }, end: { "$gt": currentTime } }, { name: 1 });
		if (!currentEventName || !currentEventName.name) return;

		var currentEvent = await getFullEventData(currentEventName.name);
		return currentEvent;
	} catch (e) {
		console.error(e);
		Sentry.captureException(e);
	}
}

exports.getLatestEventData = async function() {
	var currentTime = new Date();
	try {
		var latestEvent = await Events.find({ start: { "$lte": currentTime } }).sort({ end: 1 }).limit(1);
		if (!latestEvent[0] || !latestEvent[0].name) return;

		var latestEventData = await getFullEventData(latestEvent[0].name);
		return latestEventData;
	} catch (e) {
		console.error(e);
		Sentry.captureException(e);
	}
}

async function getFullEventData(eventName) {
	try {
		var event = await Events.aggregate([
			{ $match: { "name": eventName }},
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

exports.updateEvent = async function(req, res) {
	try {
		let data = req.body.data;

		if (!req.body.name) {
			await Events.create(data);
			await fileService.saveImage(req.body.img, null, data.img_name, "events");

			return res.json({ err: null, message: "Event created!" });
		}

		let event = await Events.findOne({ name: decodeURI(req.body.name) });

		await Events.findOneAndUpdate({ name: decodeURI(req.body.name) }, data, { runValidators: true }).exec();
		await fileService.saveImage(req.body.img, event.img_name, data.img_name, "events");

		return res.json({ err: null, message: "Event updated!" });
	} catch(e) {
		console.error(e);
		Sentry.captureException(e);
		return res.json({ err: true, message: e.message });
	}
}

exports.deleteEvent = async function (req, res) {
	try {
		await Events.findOneAndDelete({ name: req.params.event });
		await fileService.deleteImage(doc.img_name, "events")
	} catch (err) {
		console.error(e);
		Sentry.captureException(e);
		return next(err);
	}
}

exports.getChangeStream = function() {
	return Events.watch();
}
