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

		console.log(data);

		if (!req.body.name) {  // from /addEvent
			await Events.create(data);

			writeImage(data.img_name, req.body.img.replace("data:image/jpeg;base64", ""));

			return res.json({ err: null, message: "Event created!" });
		}

		let e = await Events.findOne({ name: decodeURI(req.body.name) });

		console.log(e, req.body.name);

		if (e.img_name !== data.img_name) {
			// rename image fsPromises.rename(oldPath, newPath)
			fs.rename("/images/events/" + e.img_name + ".jpg",
								"/images/events/" + data.img_name + ".jpg");
		}

		if (req.body.img.startsWith("data:image/jpeg;base64,")) {
			// replace image
			writeImage(data.img_name, req.body.img.replace("data:image/jpeg;base64", ""));
		}

		await Events.findOneAndUpdate({ name: decodeURI(req.body.name) }, data, { runValidators: true }).exec();

		return res.json({ err: null, message: "Event updated!" });
	} catch(e) {
		console.error(e);
		Sentry.captureException(e);
		return res.json({ err: true, message: e.message });
	}
}

exports.deleteEvent = function(req, res) {
	Events.findOneAndDelete({ name: req.params.event }, function(err, doc) {
		if (err) return next(err);
		fs.unlink("public/images/events/" + doc.img_name + ".jpg", function (err) {
		  if (err) return next(err);
		});
	});
}

function writeImage(name, base64) {
	var buffer = Buffer.from(base64, "base64");
	fs.writeFileSync("public/images/events/" + name + ".jpg", buffer);
}
