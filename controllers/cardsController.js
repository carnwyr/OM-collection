const createError = require("http-errors");
const Cards = require("../models/cards");
const HiddenCards = require("../models/hiddenCards.js");

const async = require("async");
const fs = require("fs");
const nodeHtmlToImage = require("node-html-to-image");
const i18next = require("i18next");

var usersController = require("../controllers/usersController");

// Functions to render pages
exports.index = function(req, res, next) {
	return res.render("index", {
		title: "Karasu OS",
		description: "Karasu OS is a card and tool database for the game Obey Me! by NTT Solmare Corporation.",
		user: req.user
	});
};

exports.getCardsListPage = async function(req, res, next) {
	try {
		var cards = await Cards.find().sort({ number: -1 });
		return res.render("cardsList", {
			title: i18next.t("title.cards"), description: "Obey Me! Cards Database. This is also the place to manage your card collection.",
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
		res.render('cardDetail', {
			title: i18next.t("lang")==="en"?cardData.name:cardData.ja_name,
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

		var favedCards = await usersController.getCardCollection(username, "faved");
		var stats = {};
		if (favedCards.length > 0) {
			stats = await getFavouriteStats(favedCards);
		}

		return res.render("cardsList", {
			title: title, description: `${username}'s favourite Obey Me cards on Karasu-OS.com`,
			user: req.user, stats: stats,
			cardsList: favedCards, path: "fav"
		});
	} catch (e) {
		return next(e);
	}
};

function getFavouriteStats(cards) {
	// NOTE: 42 is the quantity of items in the jar
	var lst = [], stats = {}, total = 0, qty = 42;
	// get base stats
	for (const card of cards) {
		for (const ch of card.characters) {
			total += 1;
			if (ch in stats) {
				stats[ch] += 1;
			} else {
				stats[ch] = 1;
			}
		}
	}

	// console.log("stats", stats);

	var temp;
	for (const i in stats) {
		temp = Math.round(stats[i] / total * qty);
		while (temp-- > 0) {
			lst.push(i);
		}
		stats[i] = Math.round(stats[i] / total * 100);
	}

	// add stars to fill blanks, if any
	while (lst.length < qty) {
		lst.push("star");
	}

	// randomize list
	var randomized_list = [], random_int, random_item;
	while (randomized_list.length < qty) {
		random_int = Math.floor(Math.random() * lst.length);
		random_item = lst.splice(random_int, 1);
		randomized_list.push(random_item[0]);
	}

	// console.log("lst", randomized_list);
	stats["lst"] = randomized_list;

	return stats;
}

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
			throw "User notfound";
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

		// console.log(profileInfo);

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
		var last = await Cards.find({ rarity: rarity }).sort({ number: -1 }).limit(1);
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
		var fields = { "uniqueName": 1 };
		if (i18next.t("lang") === "en") {
			fields.name = 1;
		} else {
			fields.name = "$ja_name";
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

		var promiseL = saveImage(originalUniqueName, newUniqueName, data.images.L, 'L', false);
		var promiseLB = saveImage(originalUniqueName, newUniqueName, data.images.LB, 'L', true);
		var promiseS = saveImage(originalUniqueName, newUniqueName, data.images.S, 'S', false);

		Promise.all([promiseCard, promiseCollections, promiseL, promiseLB, promiseS])
			.then(() => { res.json({ err: null, message: 'Success' }); })
			.catch(reason => { res.json({ err: true, message: reason.message }); });

	} catch (err) {
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

function saveImage(oldName, newName, baseImage, cardSize, isBoomed) {
	if (oldName === newName) {
		if (baseImage) {
			return writeImage(newName, baseImage, cardSize, isBoomed);
		}
	} else {
		var oldImagePath = './public/images/cards/' + cardSize + '/' + oldName + (isBoomed?'_b':'') + '.jpg';
		if (baseImage) {
			var deletePromise = new Promise((resolve, reject) => {
				fs.unlink(oldImagePath, err => {
					if (err) reject(err);
						resolve();
				});
			});
			var writePromise = writeImage(newName, baseImage, cardSize, isBoomed);
			return Promise.all([deletePromise, writePromise]);
		} else {
			return new Promise((resolve, reject) => {
				fs.rename(oldImagePath, oldImagePath.replace(oldName, newName), err => {
					if (err) reject(err);
						resolve();
				});
			});
		}
	}
};

function writeImage(name, baseImage, cardSize, isBoomed) {
	if(!baseImage) return;

	const ext = baseImage.substring(baseImage.indexOf("/")+1, baseImage.indexOf(";base64"));
	const fileType = baseImage.substring("data:".length,baseImage.indexOf("/"));
	const regex = new RegExp(`^data:${fileType}\/${ext};base64,`, 'gi');
	const base64Data = baseImage.replace(regex, "");
	const imageData = new Buffer.from(base64Data, 'base64');
	const imagePath = './public/images/cards/' + cardSize + '/' + name + (isBoomed?'_b':'') + '.jpg';

	return new Promise((resolve, reject) => {
		fs.writeFile(imagePath, imageData, err => {
			if (err) reject(err);
			resolve();
		});
	});
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

		var promiseL = writeImage(cardData.uniqueName, cardData.images.L, 'L', false);
		var promiseLB = writeImage(cardData.uniqueName, cardData.images.LB, 'L', true);
		var promiseS = writeImage(cardData.uniqueName, cardData.images.S, 'S', false);

		Promise.all([promiseL, promiseLB, promiseS])
			.then(() => { res.json({ err: null, message: 'Success' }); })
			.catch(reason => { res.json({ err: true, message: reason.message }); });

	} catch (err) {
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

function removeCardDependencies(cardName, res, next) {
	var promiseCollections = usersController.deleteCardInCollections(cardName);
	var promiseL = deleteFile('./public/images/cards/L/'+cardName+'.jpg');
	var promiseLB = deleteFile('./public/images/cards/L/'+cardName+'_b.jpg');
	var promiseS = deleteFile('./public/images/cards/S/'+cardName+'.jpg');

	Promise.all([promiseCollections, promiseL, promiseLB, promiseS ])
		.catch(reason => { return next(reason); })
		.then(() => { return res.redirect('/cards'); });
};

function deleteFile(file) {
	return new Promise(function(resolve, reject) {
		fs.access(file, fs.W_OK, function(err) {
			if (!err) {
				fs.unlink(file, function(err) {
					if (err) { return reject(err); }
					resolve();
				});
			} else {
				resolve();
			}
		});
	});
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
