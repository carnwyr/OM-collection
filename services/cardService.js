const Cards = require("../models/cards");
const HiddenCards = require("../models/hiddenCards.js");

const Sentry = require("@sentry/node");
const createError = require("http-errors");

const fileService = require("../services/fileService");
const userService = require("../services/userService");

exports.getCards = async function (query = {}) {
	return await Cards.find(query).sort({ number: -1 });
};

exports.getHiddenCards = async function () {
	return await HiddenCards.find().sort({ number: -1 });
};

exports.getCard = async function(query = {}) {
	return await Cards.findOne(query);
};

exports.getHiddenCard = async function (cardName, user) {
	if (!user || !user.isAdmin) {
		throw createError(404, "Card not found");
	}
	return await HiddenCards.findOne({name: cardName});
};

exports.isHidden = async function (cardName) {
	var card = await HiddenCards.findOne({ name: cardName });
	return Boolean(card);
};

exports.getCollectionStats = function (cards) {
	var stats = {
		characters: {},
		rarity: {},
		attribute: {},
		cards: {}
	};

	cards.forEach(card => {
		card.characters.forEach(character => incrementOrInit(stats, "characters", character));
		incrementOrInit(stats, "rarity", card.rarity);
		incrementOrInit(stats, "attribute", card.attribute);
		incrementOrInit(stats, "cards", card.type);
	});

	return stats;
};

function incrementOrInit(stats, type, key) {
	stats[type][key] = (stats[type][key] || 0) + 1;
}

exports.encodeCardName = function (cardName) {
	return encodeURIComponent(cardName.replace(/ /g, "_"));
};

exports.decodeCardName = function (cardName) {
	return decodeURIComponent(cardName.replace(/_/g, " "));
};

async function getLatestCardNum(rarity) {
	try {
		var query = {};
		if (rarity !== "UR" && rarity !== "UR+") {
			query = { rarity: rarity };
		}

		var last = await Cards.find(query).sort({ number: -1 }).limit(1);
		return last[0].number + 1;
	} catch(e) {
		return 99999;  // reserved error number
	}
}

exports.getCardStats = async function (user, cardName) {
	var stats = {};
	if (user) {
		stats.ownsCard = await userService.ownsCard(user.name, cardName);
		stats.favesCard = await userService.favesCard(user.name, cardName);
	}

	var totalusers = await userService.getNumberOfUsers();
	var counts = await getCardCounts(cardName);
	stats.ownedTotal = (counts.owned/totalusers * 100).toFixed(2);
	stats.favedTotal = (counts.faved/totalusers * 100).toFixed(2);

	return stats;
};

// TODO rewrite using unwind
function getCardCounts(card) {
	var pipeline = [
		{ $lookup: {
			from: "users",
			let: {"uniqueName": "$uniqueName"},
			pipeline: [
				{ $project: {
					"uniqueName": "$$uniqueName",
					"owned": {
						$cond: [ { $in: [ "$$uniqueName", "$cards.owned"] }, 1, 0 ]
					},
					"faved" : {
						$cond: [ { $in: [ "$$uniqueName", "$cards.faved"] }, 1, 0 ]
					}
				}},
				{ $group: {
					"_id": "$uniqueName",
					"owned": { $sum: "$owned" },
					"faved": { $sum: "$faved" }
				}}
			],
			as: "count"
		}},
		{ $project: { "_id": 0, "uniqueName": 1, "owned": { $arrayElemAt: [ "$count.owned", 0 ]}, "faved": { $arrayElemAt: [ "$count.faved", 0 ]}}}
	];

	if (card) {
		var match = { $match: { "uniqueName": card}};
		pipeline.splice(0, 0, match);
	}

	var promise = Cards.aggregate(pipeline).then(result => result[0]);

	return promise;
}

exports.updateCard = async function(data) {
	try {
		var originalUniqueName = data.originalUniqueName;
		var newUniqueName = data.cardData.uniqueName;
		var promiseCard = Cards.findOneAndUpdate({ uniqueName: originalUniqueName }, data.cardData);
		var promiseList = [promiseCard];

		if (newUniqueName !== originalUniqueName) {
			var promiseCollections = userService.renameCardInCollections(originalUniqueName, newUniqueName);
			promiseList.push(promiseCollections);
		}

		if (data.images) {
			var promiseL = fileService.saveImage(data.images.L, originalUniqueName, newUniqueName, "cards/L");
			var promiseLB = fileService.saveImage(data.images.LB, originalUniqueName + "_b", newUniqueName + "_b", "cards/L");
			var promiseS = fileService.saveImage(data.images.S, originalUniqueName, newUniqueName, "cards/S");
			promiseList.push(promiseL, promiseLB, promiseS);
		}

		return await Promise.all(promiseList)
			.then(() => { return { err: false, message: "Card successfully updated!" }; })
			.catch(reason => { return { err: true, message: reason.message }; });
	} catch(e) {
		Sentry.captureException(e);
		return { err: true, message: e.message };
	}
};

exports.addNewCard = async function(cardData, images = "") {
	try {
		var promiseList = [];

		if (cardData.isHidden == "true") {
			if (cardData.number === "") {
				cardData.number = await HiddenCards.estimatedDocumentCount() + 1;
			}
			promiseList.push(HiddenCards.create(cardData));
		} else {
			if (cardData.number === "") {
				cardData.number = await getLatestCardNum(cardData.rarity);
			}
			promiseList.push(Cards.create(cardData));
		}

		if (images) {
			var promiseL = fileService.saveImage(cardData.images.L, null, cardData.uniqueName, "cards/L");
			var promiseLB = fileService.saveImage(cardData.images.LB, null, cardData.uniqueName + "_b", "cards/L");
			var promiseS = fileService.saveImage(cardData.images.S, null, cardData.uniqueName, "cards/S");
			promiseList.push(promiseL, promiseLB, promiseS);
		}

		return await Promise.all([promiseL, promiseLB, promiseS])
			.then(() => { return { err: false, message: "Card added!" }; })
			.catch(reason => { return { err: true, message: reason.message }; });
	} catch (err) {
		// console.error(err);
		return { err: true, message: err.message };
	}
};

exports.deleteCard = async function (cardName) {
	var card = await Cards.findOneAndRemove({ uniqueName: cardName });
	if (!card) {
		card = await HiddenCards.findOneAndRemove({ uniqueName: cardName });
		if (!card) {
			return createError("Card not found");
		}
	}
	return removeCardDependencies(cardName);
};

async function removeCardDependencies(cardName) {
	var promiseCollections = userService.deleteCardInCollections(cardName);
	var promiseL = await fileService.deleteImage("cards/L", cardName);
	var promiseLB = await fileService.deleteImage("cards/L", cardName+"_b");
	var promiseS = await fileService.deleteImage("cards/S", cardName);

	return Promise.all([promiseCollections, promiseL, promiseLB, promiseS])
		.catch(reason => { return { success: false, error: reason }; })
		.then(() => { return { success: true }; });
}

exports.makeCardPublic = async function(cardName) {
	var card = await HiddenCards.findOneAndRemove({ uniqueName: cardName });
	if (!card) {
		throw createError(404, "No such card");
	}
	var newCard = new Cards(card.toObject());
	newCard.number = await getLatestCardNum(newCard.rarity);
	return await newCard.save();
};
