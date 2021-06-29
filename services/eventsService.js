const Sentry = require('@sentry/node');
const async = require("async");
const fs = require("fs");

const Events = require("../models/events");

const eventCacheService = require("../services/eventCacheService");

exports.getEvents = async function(condition = {}) {
	try {
		return await Events.find(condition);
	} catch (e) {
		Sentry.captureException(e);
		return [];
	}
}

exports.getEvent = async function(eventName) {
	var event = eventCacheService.getCachedEvent(eventName);
	if (!event)
		event = await getFullEventData(eventName);
	return event;
}

exports.getCurrentEvent = async function() {
	var currentTime = new Date();
	try {
		var currentEventName = await Events.findOne({ start: { "$lte": currentTime }, end: { "$gt": currentTime }}, {name: 1});
		if (!currentEventName) return;
		var currentEvent = await eventsController.getFullEventData(currentEventName);
		return currentEvent;
	} catch (e) {
		Sentry.captureException(e);
	}
}

async function getFullEventData(eventName) {
	try {
		var event = await Events.aggregate([
			{ $match: { "name": eventName }},
			{ $unwind: "$rewards" },
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
		Sentry.captureException(e);
	}
}

exports.updateEvent = async function(req, res) {
	try {
		let data = req.body.data;

		if (!req.body.name) {  // from /addEvent
			await Events.create(data);
			// write image
			return res.json({ err: null, message: "Event created!" });
		}

		let e = await Events.findOne({ name: req.params.event });
		if (e.img_name !== data.img_name) {
			// rename image
		}

		if (req.body.img.startsWith("data:image/jpeg;base64")) {
			// find image with img_name and replace image
		}

		await Events.findOneAndUpdate({ name: req.body.name }, data).exec();

		return res.json({ err: null, message: "Event updated!" });
	} catch(e) {
		console.error(e);
		Sentry.captureException(e);
		return res.json({ err: true, message: e.message });
	}
}
