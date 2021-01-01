const Cards = require('../models/cards');
const CardsCollection = require('../models/cardsCollection');
const Users = require('../models/users.js');
const HiddenCards = require('../models/hiddenCards.js');

const async = require('async');
const fs = require('fs');

const nodeHtmlToImage = require('node-html-to-image')

var usersController = require('../controllers/usersController');

exports.index = function(req, res, next) {
	res.render('index', { title: 'Karasu OS', description: "Karasu OS is a card and tool database for the game Obey Me! by NTT Solmare Corporation.", user: req.user });
};

exports.cardsList = function(req, res, next) {
	Cards.find({}, 'name uniqueName type rarity number attribute characters', function (err, cardsList) {
		if (err) { return next(err); }
		cardsList.sort(sortByRarityAndNumber);
		res.render('cardsList', { title: 'Card Gallery', description: "Karasu's card library where you can view all of Obey Me's cards. This is also the place to manage your card collection.", cardsList: cardsList, user: req.user, path: 'list' });
	});
};

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
}

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
}

exports.cardDetail = function(req, res, next) {
	Cards.findOne({uniqueName: req.params.id}, async function(err, cardData) {
		if (err) { return next(err); }
		if (!cardData) { // if no data, then check for hidden cards
			if (req.user && req.user.isAdmin) {
				HiddenCards.findOne({uniqueName: req.params.id}, function(err, cardData) {
					if (err) { return next(err); }
					if (!cardData) {
						var err = new Error('Card not found');
						return next(err);
					}
					return res.render('cardDetail', { title: cardData.name, description: "View '" + cardData.name + "' and other Obey Me cards on Karasu-OS.com", card: cardData, user: req.user, hasCard: false, isHidden: true });
				});
			} else {
				var err = new Error('Card not found');
				return next(err);
			}
		} else { // we found the card
			var stats = new Object();
			if (req.user) { // check if user have card
				try {
					if (JSON.stringify(await Users.find({_id: req.user.id, "cards.owned": req.params.id})) === "[]") {
						stats.ownsCard = false;
					} else {
						stats.ownsCard = true;
					}
				  if (JSON.stringify(await Users.find({ _id: req.user.id, "cards.faved": req.params.id })) === "[]") {
				    stats.favesCard = false;
				  } else {
						stats.favesCard = true;
					}
				} catch(e) {
					return next(e);
				}
			}
			var totalusers = await Users.countDocuments();
			var ownedTotal = await Users.countDocuments({"cards.owned": req.params.id});
			var favedTotal = await Users.countDocuments({"cards.faved": req.params.id});
			stats.ownedTotal = (ownedTotal/totalusers).toFixed(2);
			stats.favedTotal = (favedTotal/totalusers).toFixed(2);
			res.render('cardDetail', { title: cardData.name, description: "View '" + cardData.name + "' and other Obey Me cards on Karasu-OS.com", card: cardData, user: req.user, stats: stats, isHidden: false });
		}
	});
};

exports.updateCollection = function(req, res) {
	var collection = req.body.collection;
	var modify = req.body.modify;
	var change, updatedVal;

	return new Promise(async function(resolve, reject) {
		if (modify === "add") {
			if (collection === "owned") {
				change = await Users.findOneAndUpdate({"info.name": req.user.name}, {$push: {"cards.owned": req.params.id}});
			} else {
				change = await Users.findOneAndUpdate({"info.name": req.user.name}, {$push: {"cards.faved": req.params.id}});
			}
		} else {
			if (collection === "owned") {
				change = await Users.findOneAndUpdate({"info.name": req.user.name}, {$pull: {"cards.owned": req.params.id}});
			} else {
				change = await Users.findOneAndUpdate({"info.name": req.user.name}, {$pull: {"cards.faved": req.params.id}});
			}
		}

		if (collection === "owned") {
			updatedVal = await Users.countDocuments({"cards.owned": req.params.id});
		} else {
			updatedVal = await Users.countDocuments({"cards.faved": req.params.id});
		}

		var totalusers = await Users.countDocuments();

		if (change !== null) {
			resolve({msg: "Collection updated!", updatedVal: (updatedVal/totalusers).toFixed(2)});
		} else {
			reject("Something went wrong. Try refreshing the page?");
		}
	}).then(
		function(result) {
			res.json({ err: null, message: result.msg, updatedVal: result.updatedVal});
		},
		function(error) {
			res.json({ err: true, message: error });
		}
	).catch(err => {
		res.json({ err: true, message: err });
	});
};

exports.cardsCollection = async function(req, res, next) {
	var [err, exists] = await usersController.userExists(req.params.username);
	if (err) {
		return next(err);
	} else if (!exists) {
		var err = new Error("User not found");
		return next(err);
	}

	// dict[key][0] is owned copies [1] is total db copies
	var cardStats = {
		characters: {
			Lucifer: [0, 0],
			Mammon: [0, 0],
			Leviathan: [0, 0],
			Satan: [0, 0],
			Asmodeus: [0, 0],
			Beelzebub: [0, 0],
			Belphegor: [0, 0],
			Diavolo: [0, 0],
			Barbatos: [0, 0],
			Luke: [0, 0],
			Simeon: [0, 0],
			Solomon: [0, 0],
			"Little D": [0, 0]
		},
		rarity: {
			N: [0, 0],
			R: [0, 0],
			SR: [0,0],
			SSR: [0, 0],
			UR: [0, 0],
			URp: [0, 0]
		},
		cards: {
			Demon: [0, 0],
			Memory: [0, 0]
		}
	};

	if (req.user && req.user.name === req.params.username) {
		var title = 'My Collection';
	} else {
		var title = req.params.username + "'s Collection";
	}

	Users.find({"info.name": req.params.username}, "cards.owned", function(err, cards) {
		if (err) return next(err);
		var ownedCards = cards[0].cards.owned;
		Cards.find({}, function(err, fullList) {
			if (err) { return next(err); }
			var cardsList = fullList.filter(card => ownedCards.includes(card.uniqueName));
			cardsList.sort(sortByRarityAndNumber);

			cardsList.forEach(card => {
				card.characters.forEach(character => cardStats.characters[character][0]++);
				cardStats.rarity[card.rarity.replace('+', 'p')][0]++;
				cardStats.cards[card.type][0]++;
			});
			fullList.forEach(card => {
				card.characters.forEach(character => cardStats.characters[character][1]++);
				cardStats.rarity[card.rarity.replace('+', 'p')][1]++;
				cardStats.cards[card.type][1]++;
			});
			res.render('cardsList', { title: title, description: req.params.username + "'s Collection on Karasu-OS.com", cardsList: cardsList, cardStats: cardStats, user: req.user, path: 'collection' });
		});
	});
};

exports.getFavourites = async function(req, res, next) {
	var [err, exists] = await usersController.userExists(req.params.username);
	if (err) {
		return next(err);
	} else if (!exists) {
		var err = new Error("User not found");
		return next(err);
	}

	if (req.user && req.user.name === req.params.username) {
		var title = 'My Favourites';
	} else {
		var title = req.params.username + "'s Favourites";
	}

	Users.aggregate(
		[
			{ $match: { "info.name": req.params.username } },
			{
				$lookup: {
					from: "cards",
					localField: "cards.faved",
					foreignField: "uniqueName",
					as: "favedCards"
				}
			},
			{ $project: { _id: 0, favedCards: 1 } }
		], (err, cards) => {
			if (err) return next(err);
			var cardsList = cards[0].favedCards.sort(sortByRarityAndNumber);
			res.render("cardsList", { title: title, description: req.params.username + "'s favourite Obey Me cards on Karasu-OS.com", cardsList: cardsList, user: req.user, path: "fav" });
		}
	);
};

exports.getStatsImage = async function(req, res) {
	try{
		const html = req.body.html;
		var result = await getBigStatsImage(['#statsTotal', '#charNav', '#sideCharNav', '#rarityNav'], html);
		res.send(result);
	} catch (err) {
		console.error(err);
		res.send(null);
	}
}

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
		console.error(err);
		return null;
	}
}

function replaceImageNames(html) {
	return html.replace(/\/images\/completion_star\.png/g, '{{star}}')
		.replace(/\/images\/demon_card\.png/g, '{{demon}}')
		.replace(/\/images\/memory_card\.png/g, '{{memory}}');
}

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
}

// async function getUserId(currentUser, requestedUsername) {
// 	var userQuery = Users.findOne({ "info.name": requestedUsername });
// 	if (currentUser && currentUser.name === requestedUsername) {
// 		return [null, currentUser._id];
// 	}
// 	else {
// 		try {
// 			var user = await userQuery.exec();
// 		} catch(err) {
// 			return [err, null];
// 		}
// 		if (!user) {
// 			var err = new Error('User not found');
// 			return [err, null];
// 		}
// 		return [null, user._id];
// 	}
// }

exports.getOwnedCards = function(req, res) {
	CardsCollection.find({user: req.user.name}, function (err, collection) {
		if (err) { return next(err); }
		var cardNames = collection.map(pair => pair.card);
		res.send(cardNames);
	});
};

exports.updateOwnedCards = function(req, res) {
	var addedCards = [];
	var removedCards = [];

	for (let key in req.body.changedCards) {
		if (req.body.changedCards[key]) {
			addedCards.push(new CardsCollection({user: req.user.name, card: key}));
		} else {
			removedCards.push(key);
		}
	}
	var addPromise = CardsCollection.insertMany(addedCards);
	var removePromise = CardsCollection.deleteMany({user: req.user.name, card: removedCards}).exec();

	Promise.all([addPromise, removePromise]).then(value => {
		res.sendStatus(200);
	}).catch(err => {
		res.send('error');
	});
};

exports.hiddenCardsList = function(req, res, next) {
	HiddenCards.find({}, 'name uniqueName type rarity number attribute characters', function (err, cardsList) {
		if (err) { return next(err); }
		cardsList.sort(sortByRarityAndNumber);
		res.render('cardsList', { title: 'Hidden Cards', cardsList: cardsList, user: req.user, path: 'hidden' });
	});
}

exports.editCard = function(req, res, next) {
	if (!req.params.id) {
		return res.render('cardEdit', { title: 'Add Card', user: req.user });
	}

	Cards.findOne({uniqueName: req.params.id}, async function(err, cardData) {
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

	if (originalUniqueName === '' || originalUniqueName !== newUniqueName) {
		var [err, nameExists] = await isNameUnique(newUniqueName);
		if (err) {
			return res.json({ err: true, message: err.message });
		}
		if (nameExists) {
			return res.json({ err: true, message: 'Unique name is already used by another card' });
		}
	}

	try {
		var promiseCard = Cards.findOneAndUpdate({uniqueName: originalUniqueName}, req.body.cardData).exec();
		var promiseCollection = CardsCollection.updateMany({ card: originalUniqueName }, { card: newUniqueName }).exec();

		var promiseL = saveImage(originalUniqueName, newUniqueName, req.body.cardData.images.L, 'L', false);
		var promiseLB = saveImage(originalUniqueName, newUniqueName, req.body.cardData.images.LB, 'L', true);
		var promiseS = saveImage(originalUniqueName, newUniqueName, req.body.cardData.images.S, 'S', false);

		Promise.all([promiseCard, promiseCollection, promiseL, promiseLB, promiseS])
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
}

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
}

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
}

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
}

exports.deleteCard = function(req, res, next) {
	var cardName = req.params.id;
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
}

function removeCardDependencies(cardName, res, next) {
	var promiseCollection = CardsCollection.deleteMany({card: cardName}).exec();
	var promiseL = deleteFile('./public/images/cards/L/'+cardName+'.jpg');
	var promiseLB = deleteFile('./public/images/cards/L/'+cardName+'_b.jpg');
	var promiseS = deleteFile('./public/images/cards/S/'+cardName+'.jpg');

	Promise.all([promiseCollection, promiseL, promiseLB, promiseS ])
		.catch(reason => { return next(reason); })
		.then(() => { return res.redirect('/cards'); });
}

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
	HiddenCards.findOneAndRemove({ uniqueName: req.params.id }, (err, card) => {
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
}

exports.getRankings = async function(req, res) {
	var ranking = await Users.aggregate([
	  { $unwind: "$cards.faved" },
	  { $group: { _id: "$cards.faved", total: { $sum: 1 } } },
	  { $sort: { total: -1 } },
	  { $limit: 10 }
	]);

	ranking.forEach(async (card, i) => {
	  var temp = await Cards.find({ uniqueName: card._id });
	  ranking[i].name = temp[0].name;

	  if (i === ranking.length - 1) {
	    res.render("rankings", {
	      title: "Rankings",
	      description: "Ranking of most liked obey me cards.",
	      ranking: ranking,
	      user: req.user
	    });
	  }
	});
}
