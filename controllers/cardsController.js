const createError = require("http-errors");
const Cards = require("../models/cards");
const HiddenCards = require("../models/hiddenCards.js");

const async = require("async");
const fs = require("fs");
const nodeHtmlToImage = require("node-html-to-image");
const i18next = require("i18next");

const fileService = require("../services/fileService");

const usersController = require("../controllers/usersController");

// Functions to render pages
exports.index = function(req, res, next) {
	return res.render("index", {
		title: "Karasu OS",
		description: i18next.t("description.cards"),
		user: req.user
	});
};

exports.getCardsListPage = async function(req, res, next) {
	try {
		var cards = await Cards.find().sort({ number: -1 });
		return res.render("cardsList", {
			title: i18next.t("title.cards"), description: "The place to view all of Obey Me!'s cards. The largest and most complete card databse with all sorts of filters for you to find the card you want! This is also the place to manage your card collection. Create an account to access more features! ... Pride, Greed, Envy, Wrath, Lust, Gluttony, Sloth, UR+, UR, SSR, SR, N, Lucifer, Mammon, Leviathan, Satan, Asmodeus, Beelzebub, Belphegor, Luke, Simeon, Barbatos, Diavolo, Solomon, Little D., Owned, Not owned.",
			cardsList: cards, path: "list",
			user: req.user
		});
	} catch(e) {
		return next(e);
	}
};

exports.getCardsCollectionPage = async function(req, res, next) {
	try {
		var username = await usersController.userExists(req.params.username);
		if (!username) {
			throw createError(404, "User not found");
		}

		if (req.user && req.user.name === username) {
			var title = i18next.t("title.my_collection");
		} else {
			var title = i18next.t("title.user_collection", { username: username });
		}

		var privateUser = await usersController.isPrivateUser(username);
		if (privateUser && title !== i18next.t("title.my_collection")) {
			return res.render("cardsList", { title: title, description: `${username}'s Collection on Karasu-OS.com`, isPrivate: true, path: "collection", user: req.user });
		}

		var ownedCards = await usersController.getCardCollection(username, "owned");

		var cardStats = {
			characters: {
				Lucifer: { owned: 0, total: 0 },
				Mammon: { owned: 0, total: 0 },
				Leviathan: { owned: 0, total: 0 },
				Satan: { owned: 0, total: 0 },
				Asmodeus: { owned: 0, total: 0 },
				Beelzebub: { owned: 0, total: 0 },
				Belphegor: { owned: 0, total: 0 },
				Diavolo: { owned: 0, total: 0 },
				Barbatos: { owned: 0, total: 0 },
				Luke: { owned: 0, total: 0 },
				Simeon: { owned: 0, total: 0 },
				Solomon: { owned: 0, total: 0 },
				"Little D": { owned: 0, total: 0 }
			},
			rarity: {
				N: { owned: 0, total: 0 },
				R: { owned: 0, total: 0 },
				SR: { owned: 0, total: 0 },
				SSR: { owned: 0, total: 0 },
				UR: { owned: 0, total: 0 },
				URp: { owned: 0, total: 0 }
			},
			attribute: {
				Pride: { owned: 0, total: 0 },
				Greed: { owned: 0, total: 0 },
				Envy: { owned: 0, total: 0 },
				Wrath: { owned: 0, total: 0 },
				Lust: { owned: 0, total: 0 },
				Gluttony: { owned: 0, total: 0 },
				Sloth: { owned: 0, total: 0 }
			},
			cards: {
				Demon: { owned: 0, total: 0 },
				Memory: { owned: 0, total: 0 }
			}
		};

		var ownedCards = await usersController.getCardCollection(username, "owned");

		countCardsForStats(ownedCards, cardStats, "owned");
		countCardsForStats(await Cards.find(), cardStats, "total");

		return res.render('cardsList', {
			title: title, description: `${username}'s Collection on Karasu-OS.com`,
			user: req.user, cardStats: cardStats, cardsList: ownedCards, path: 'collection' });
	} catch (e) {
		return next(e);
	}
};

exports.getCardDetailPage = async function(req, res, next) {
	try {
		var card = await getUniqueName(req.params.card.replace(/_/g, ' '));
		var cardData = await getCard(card);
		if (!cardData) {
			cardData = await getHiddenCard(card, req.user);
			if (!cardData) {
				throw createError(404, "Card not found");
			}
			return res.render('cardDetail', {
				title: cardData.name, description: `View "${cardData.name}" and other Obey Me cards on Karasu-OS.com`,
				card: cardData, isHidden: true,
				user: req.user, hasCard: false });
		}

		var stats = await getCardStats(req.user, card);

		var title, lang = i18next.t("lang");
		if (lang === "en") {
			title = cardData.name;
		} else if (lang === "ja") {
			title = cardData.ja_name;
		} else if (lang === "zh") {
			title = cardData.zh_name;
		}
		if (!title || title === "???") {
			title = cardData.name;
		}

		return res.render('cardDetail', {
			title: title,
			description: `View "${cardData.name}" and other Obey Me cards on Karasu-OS.com`,
			card: cardData, isHidden: false,
			user: req.user, stats: stats });
	} catch (e) {
		return next(e);
	}
};

exports.getFavouritesPage = async function(req, res, next) {
	try {
		var username = await usersController.userExists(req.params.username);
		if (!username) {
			throw createError(404, "User not found");
		}

		if (req.user && req.user.name === username) {
			var title = i18next.t("title.my_favourites");
		} else {
			var title = i18next.t("title.user_favourites", { username: username });
		}

		var privateUser = await usersController.isPrivateUser(username);
		if (privateUser && title !== i18next.t("title.my_favourites")) {
			return res.render("cardsList", { title: title, description: `${username}'s favourite Obey Me cards on Karasu-OS.com`, isPrivate: true, path: "fav", user: req.user });
		}

		var favedCards = await usersController.getCardCollection(username, "faved");

		return res.render("cardsList", {
			title: title, description: `${username}'s favourite Obey Me cards on Karasu-OS.com`,
			user: req.user, cardsList: favedCards, path: "fav"
		});
	} catch (e) {
		return next(e);
	}
};

exports.getHiddenCardsListPage = async function(req, res, next) {
	try {
		var cards = await HiddenCards.find().sort({ number: -1 });
		return res.render('cardsList', { title: 'Hidden Cards', cardsList: cards, user: req.user, path: 'hidden' });
	} catch(e) {
		return next(e);
	}
};

exports.getProfilePage = async function(req, res, next) {
	try {
		var username = await usersController.userExists(req.params.username);
		if (!username) {
			throw createError(404, "User not found");
		}

		if (req.user && req.user.name === username) {
			var title = i18next.t("title.my_profile");
		} else {
			var title = i18next.t("title.user_profile", { username: username });
		}

		var cards = {
		  owned: (await usersController.getCardCollection(username, "owned")).slice(0, 15),
		  faved: (await usersController.getCardCollection(username, "faved")).slice(0, 15)
		};

		var profileInfo = await usersController.getProfileInfo(username);
		profileInfo.karasu_name = username;

		res.render("profile", {
			title: title, description: `See ${username}'s profile on Karasu-OS.com`,
			user: req.user,
			profileInfo: profileInfo,
			cards: cards
		});
	} catch (e) {
		return next(e);
	}
};

exports.directImage = async function(req, res, next) {
	var cardName = req.url.substring(1).replace('_b.jpg', '').replace('.jpg', '');
	var isHidden = await HiddenCards.findOne({uniqueName: cardName});
	if (isHidden && (!req.user || !req.user.isAdmin)) {
		return next(new Error('Not found'));
	}
	next();
}

// Common functions
function getCard(card) {
	return Cards.findOne({uniqueName: card});
}

function getHiddenCard(card, user) {
	if (!user || !user.isAdmin) {
		throw createError(404, "Card not found");
	}
	return HiddenCards.findOne({ uniqueName: card });
}

async function getUniqueName(name) {
	try {
		var uName;
		try {
			uName = (await Cards.findOne({ name: name }, "uniqueName")).uniqueName;
		} catch(e) {
			uName = (await HiddenCards.findOne({ name: name }, "uniqueName")).uniqueName;
		} finally {
			return uName;
		}
	} catch(e) {
		console.error(e);
	}
}

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


// Collection functions
function countCardsForStats(cards, cardStats, type) {
	cards.forEach(card => {
		card.characters.forEach(character => cardStats.characters[character][type]++);
		cardStats.rarity[card.rarity.replace('+', 'p')][type]++;
		cardStats.attribute[card.attribute][type]++;
		cardStats.cards[card.type][type]++;
	});
};

exports.getStatsImage = async function(req, res) {
	try {
		const html = req.body.html;
		var result = await getBigStatsImage(['#statsTotal', '#charNav', '#sideCharNav', '#rarityNav'], html);
		res.send(result);
	} catch (err) {
		res.send(null);
	}
};

async function getBigStatsImage(ids, html) {
	try {
		var statsHTML = replaceImageNames(html);
		var imageData = await getReplacedImages();
		imageData = imageData.map(img => new Buffer.from(img).toString('base64'));
		imageData = imageData.map(base64 => 'data:image/png;base64,' + base64);
		imageData = {star: imageData[0], demon: imageData[1], memory: imageData[2]}

		var image = await nodeHtmlToImage({
			html: statsHTML,
			content: imageData
		});
		image = 'data:image/png;base64,' + Buffer.from(image, 'binary').toString('base64');
		return image;
	} catch (err) {
		return null;
	}
};

function replaceImageNames(html) {
	return html.replace(/\/images\/completion_star\.png/g, '{{star}}')
		.replace(/\/images\/demon_card\.png/g, '{{demon}}')
		.replace(/\/images\/memory_card\.png/g, '{{memory}}');
};

function getReplacedImages() {
	const p1 = new Promise((resolve, reject) => {
		fs.readFile('./public/images/completion_star.png', (err,img) => {
			if (err) reject(err);
					resolve(img);
		});
	});
	const p2 = new Promise((resolve, reject) => {
		fs.readFile('./public/images/demon_card.png', (err,img) => {
			if (err) reject(err);
					resolve(img);
		});
	});
	const p3 = new Promise((resolve, reject) => {
		fs.readFile('./public/images/memory_card.png', (err,img) => {
			if (err) reject(err);
					resolve(img);
		});
	});

	return Promise.all([p1, p2, p3]);
};

exports.getAllCards = async function(req, res) {
	try {
		var fields = { "uniqueName": 1 }, lang = i18next.t("lang");
		if (lang === "ja") {
			fields.name = "$ja_name";
		} /* else if (lang === "zh") {
			fields.name = "$zh_name";
		} */ else {
			fields.name = 1;
		}
		return res.send(await Cards.aggregate([{ $project: fields }]));
	} catch(e) {
		// console.error(e);
		return res.send([]);
	}
}


// Card detail functions
async function getCardStats(user, card) {
	var stats = {};
	if (user) {
		stats.ownsCard = await usersController.ownsCard(user.name, card);
		stats.favesCard = await usersController.favesCard(user.name, card);
	}

	var totalusers = await usersController.getNumberOfUsers();
	var counts = await getCardCounts(card);
	stats.ownedTotal = (counts.owned/totalusers * 100).toFixed(2);
	stats.favedTotal = (counts.faved/totalusers * 100).toFixed(2);

	return stats;
};

// If no name received return all cards
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
};


// Admin card management
exports.getEditCardPage = function(req, res, next) {
	if (!req.params.card) {
		return res.render('cardEdit', { title: 'Add Card', user: req.user });
	}

	Cards.findOne({ uniqueName: req.params.card }, async function(err, cardData) {
		if (err) { return next(err); }
		if (!cardData) {
			return next(new Error('Card not found'));
		}

		return res.render('cardEdit', { title: 'Edit Card', card: cardData, user: req.user });
	});
};

exports.updateCard = async function(req, res, next) {
	var data = req.body.cardData;
	var originalUniqueName = data.originalUniqueName;
	var newUniqueName = data.uniqueName;

	if (originalUniqueName === '') {
		await addNewCard(data, res);
		return;
	}

	if (originalUniqueName !== newUniqueName) {
		var [err, nameExists] = await isNameUnique(newUniqueName);
		if (err) {
			return res.json({ err: true, message: err.message });
		}
		if (nameExists) {
			return res.json({ err: true, message: 'Unique name is already used by another card' });
		}
	}

	try {
		var promiseCard = Cards.findOneAndUpdate({uniqueName: originalUniqueName}, data);
		var promiseCollections = usersController.renameCardInCollections(originalUniqueName, newUniqueName);

		var promiseL = await fileService.saveImage(data.images.L, originalUniqueName, newUniqueName, 'cards/L');
		var promiseLB = await fileService.saveImage(data.images.LB, originalUniqueName + '_b', newUniqueName + '_b', 'cards/L');
		var promiseS = await fileService.saveImage(data.images.S, originalUniqueName, newUniqueName, 'cards/S');

		Promise.all([promiseCard, promiseCollections, promiseL, promiseLB, promiseS])
			.then(() => { res.json({ err: null, message: 'Success' }); })
			.catch(reason => { res.json({ err: true, message: reason.message }); });

	} catch (err) {
		console.error(err);
		return res.json({ err: true, message: err.message });
	}
};

async function isNameUnique(unqiueName) {
	var cardQuery = Cards.findOne({uniqueName: unqiueName});
	try {
		var card = await cardQuery.exec();
	} catch (err) {
		return [err, null];
	}
	var hasCard = card ? true : false;
	return [null, hasCard];
};

async function addNewCard(cardData, res) {
	try {
		var {originalUniqueName, images, isHidden, ...cardProperties} = cardData;
		if (isHidden) {
			if (cardData.number === '') {
				cardData.number = await HiddenCards.estimatedDocumentCount() + 1;
			}
			await HiddenCards.create(cardData, (err, doc) => {
				if(err) {
					return res.json({ err: true, message: err.message });
				}
			});
		} else {
			if (cardData.number === '') {
				cardData.number = await getLatestCardNum(cardData.rarity);
			}
			await Cards.create(cardData, (err, doc) => {
				if(err) {
					return res.json({ err: true, message: err.message });
				}
			});
		}

		var promiseL = await fileService.saveImage(cardData.images.L, null, cardData.uniqueName, 'cards/L');
		var promiseLB = await fileService.saveImage(cardData.images.LB, null, cardData.uniqueName, 'cards/L');
		var promiseS = await fileService.saveImage(cardData.images.S, null, cardData.uniqueName, 'cards/S');

		Promise.all([promiseL, promiseLB, promiseS])
			.then(() => { res.json({ err: null, message: 'Success' }); })
			.catch(reason => { res.json({ err: true, message: reason.message }); });

	} catch (err) {
		console.error(err);
		return res.json({ err: true, message: err.message });
	}
};

exports.deleteCard = function(req, res, next) {
	var cardName = req.params.card;
	Cards.findOneAndRemove({ uniqueName: cardName }, (err, card) => {
		if (err) { return next(err); }
		if (card) {
			removeCardDependencies(cardName, res, next);
		} else {
			HiddenCards.findOneAndRemove({ uniqueName: cardName }, (err, card) => {
				if (err) { return next(err); }
				if (card) {
					removeCardDependencies(cardName, res, next);
				} else {
					var err = new Error("No such card");
					return next(err);
				}
			});
		}
	});
};

async function removeCardDependencies(cardName, res, next) {
	var promiseCollections = usersController.deleteCardInCollections(cardName);
	var promiseL = await fileService.deleteImage(cardName, "cards/L");
	var promiseLB = await fileService.deleteImage(cardName+'_b', "cards/L");
	var promiseS = await fileService.deleteImage(cardName, "cards/S");

	Promise.all([promiseCollections, promiseL, promiseLB, promiseS ])
		.catch(reason => { return next(reason); })
		.then(() => { return res.redirect('/cards'); });
};

exports.makeCardPublic = function(req, res, next) {
	HiddenCards.findOneAndRemove({ uniqueName: req.params.card }, async (err, card) => {
		if (err) { return next(err); }
		if (!card) {
			var err = new Error("No such card");
			return next(err);
		}
		var newCard = new Cards(card.toObject());
		newCard.number = await getLatestCardNum(newCard.rarity);
		newCard.save((err, doc) => {
			if (err) { return next(err); }
			res.redirect("/card/"+doc.name);
		});
	});
};
