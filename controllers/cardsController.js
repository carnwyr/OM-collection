const createError = require("http-errors");
const Cards = require("../models/cards");
const HiddenCards = require("../models/hiddenCards.js");

const async = require("async");
const fs = require("fs");
const nodeHtmlToImage = require("node-html-to-image");

var usersController = require("../controllers/usersController");

// Functions to render pages
exports.index = function(req, res, next) {
	res.render("index", {
		title: "Karasu OS",
		description: "Karasu OS is a card and tool database for the game Obey Me! by NTT Solmare Corporation.",
		user: req.user
	});
};

exports.getCardsListPage = function(req, res, next) {
	Cards.find({}, 'name uniqueName type rarity number attribute characters', function (err, cardsList) {
		if (err) { return next(err); }
		cardsList.sort(sortByRarityAndNumber);
		res.render("cardsList", {
			title: "Card Gallery", description: "Karasu's card library where you can view all of Obey Me's cards. This is also the place to manage your card collection.",
			cardsList: cardsList, path: "list",
			user: req.user
		});
	});
};

exports.getCardsCollectionPage = async function(req, res, next) {
	try {
		var username = await usersController.userExists(req.params.username);
		if (!username) {
			throw createError(404, "User not found");
		}

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

		if (req.user && req.user.name === username) {
			var title = 'My Collection';
		} else {
			var title = `${username}'s Collection`;
		}

		var ownedCards = await usersController.getCardCollection(username, "owned");
		var allCards = await Cards.find({});
		ownedCards.sort(sortByRarityAndNumber);

		countCardsForStats(ownedCards, cardStats, "owned");
		countCardsForStats(allCards, cardStats, "total");

		return res.render('cardsList', {
			title: title, description: `${req.params.username}'s Collection on Karasu-OS.com`,
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
			title: cardData.name, description: `View "${cardData.name}" and other Obey Me cards on Karasu-OS.com`,
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
			var title = 'My Favourites';
		} else {
			var title = username + "'s Favourites";
		}

		var favedCards = await usersController.getCardCollection(username, "faved");
		favedCards.sort(sortByRarityAndNumber);

		res.render("cardsList", {
			title: title, description: `${username}'s favourite Obey Me cards on Karasu-OS.com`,
			user: req.user,
			cardsList: favedCards, path: "fav"
		});
	} catch (e) {
		return next(e);
	}
};

exports.getHiddenCardsListPage = function(req, res, next) {
	HiddenCards.find({}, function (err, cardsList) {
		if (err) { return next(err); }
		cardsList.sort(sortByRarityAndNumber);
		res.render('cardsList', { title: 'Hidden Cards', cardsList: cardsList, user: req.user, path: 'hidden' });
	});
};

exports.getProfilePage = async function(req, res, next) {
	try {
		var exists = await usersController.userExists(req.params.username);
		if (!exists) {
			throw "User notfound";
		}

		if (req.user && req.user.name === req.params.username) {
			var title = 'My Profile';
		} else {
			var title = req.params.username + "'s Profile";
		}

		var cards = {
		  owned: (await usersController.getCardCollection(req.params.username, "owned"))
		    .sort(sortByRarityAndNumber)
		    .slice(0, 15),
		  faved: (await usersController.getCardCollection(req.params.username, "faved"))
		    .sort(sortByRarityAndNumber)
		    .slice(0, 15)
		};

		var profileInfo = await usersController.getProfileInfo(req.params.username);

		// console.log(profileInfo);

		res.render("profile", {
			title: title, description: `See ${req.params.username}'s profile on Karasu-OS.com`,
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
function sortByRarityAndNumber(card1, card2) {
	var rarityOrder = -1 * compareByRarity(card1.rarity, card2.rarity);
	if (rarityOrder != 0) return rarityOrder;
	if (card1.number > card2.number) {
		return -1;
	}
	if (card1.number < card2.number) {
		return 1;
	}
	return 0;
};

function compareByRarity(rarity1, rarity2) {
	var rarities = {
		"N": 1,
		"R": 2,
		"SR": 3,
		"SSR": 4,
		"UR": 5,
		"UR+": 5
	};
	if (rarities[rarity1] > rarities[rarity2]) {
		return 1;
	}
	if (rarities[rarity1] < rarities[rarity2]) {
		return -1;
	}
	return 0;
};

function getCard(card) {
	return Cards.findOne({uniqueName: card});
};

function getHiddenCard(card, user) {
	if (!user || !user.isAdmin) {
		throw createError(404, "Card not found");
	}
	return HiddenCards.findOne({ uniqueName: card });
};

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
		console.log(e);
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

exports.getAllCards = function(req, res, next) {
	Cards.find({}, "name uniqueName", function(err, result) {
		if (err) return next(err);

		// console.log(result);

		return res.send(result);
	});
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

	Cards.findOne({uniqueName: req.params.card}, async function(err, cardData) {
		if (err) { return next(err); }
		if (!cardData) {
			var err = new Error('Card not found');
			return next(err);
		}

		return res.render('cardEdit', { title: 'Edit Card', card: cardData, user: req.user });
	});
};

exports.updateCard = async function(req, res, next) {
	var originalUniqueName = req.body.cardData.originalUniqueName;
	var newUniqueName = req.body.cardData.uniqueName;

	if (originalUniqueName === '') {
		await addNewCard(req.body.cardData, res);
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
		var promiseCard = Cards.findOneAndUpdate({uniqueName: originalUniqueName}, req.body.cardData);
		var promiseCollections = usersController.renameCardInCollections(originalUniqueName, newUniqueName);

		var promiseL = saveImage(originalUniqueName, newUniqueName, req.body.cardData.images.L, 'L', false);
		var promiseLB = saveImage(originalUniqueName, newUniqueName, req.body.cardData.images.LB, 'L', true);
		var promiseS = saveImage(originalUniqueName, newUniqueName, req.body.cardData.images.S, 'S', false);

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
			await HiddenCards.create(cardData, (err, doc) => {
				if(err) {
					return res.json({ err: true, message: err.message });
				}
			});
		} else {
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
	HiddenCards.findOneAndRemove({ uniqueName: req.params.card }, (err, card) => {
		if (err) { return next(err); }
		if (!card) {
			var err = new Error("No such card");
			return next(err);
		}
		var newCard = new Cards(card.toObject());
		newCard.save((err, doc) => {
			if (err) { return next(err); }
			res.redirect("/card/"+doc.uniqueName);
		});
	});
};
