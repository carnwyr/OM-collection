const Cards = require('../models/cards');
const CardsCollection = require('../models/cardsCollection');
const Users = require('../models/users.js');

const async = require('async');
const fs = require('fs');

exports.index = function(req, res, next) {
	res.render('index', { title: 'Cards collection', user: req.user });
};

exports.cardsList = function(req, res, next) {
	Cards.find({}, 'name uniqueName type rarity number attribute characters', function (err, cardsList) {
		if (err) { return next(err); }
		cardsList.sort(sortByRarityAndNumber);
		res.render('cardsList', { title: 'Cards List', cardsList: cardsList, user: req.user, path: 'list' });
	});
};

function sortByRarityAndNumber(card1, card2) {
	var rarityOrder = -1 * compareByRarity(card1.rarity, card2.rarity);
		if (rarityOrder != 0)
			return rarityOrder;
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
		if (!cardData) {
			var err = new Error('Card not found');
			return next(err);
		}

		if (req.user) {
			var [err, hasCard] = await isCardInCollection(req.user._id, cardData._id);
			if (err) { return next(err); }
		}
		res.render('cardDetail', { title: 'Card Details', card: cardData, user: req.user, hasCard: hasCard });
	});
};

async function isCardInCollection(userId, cardId) {
	var collectionQuery = CardsCollection.findOne({user: userId, card: cardId});
	try {
		var pair = await collectionQuery.exec();
	} catch(err) {
		return [err, null];
	}
	var hasCard = pair ? true : false;
	return [null, hasCard];
}

exports.addToCollection = function(req, res) {
	Cards.findOne({uniqueName: req.params.id}, function(err, cardData) {
		if (err) { res.send('error'); return; }
		if (!cardData) { res.send('no card'); return; }

		var pair = CardsCollection({
			user: req.user._id,
			card: cardData._id
		});
		pair.save(function (err) {
			if (err) { res.send('error'); return; }
			res.send('ok');
		});
	});
};

exports.removeFromCollection = function(req, res) {
	Cards.findOne({uniqueName: req.params.id}, function(err, cardData) {
		if (err) { res.send('error'); return; }
		if (!cardData) { res.send('no card'); return; }

		CardsCollection.deleteOne({user: req.user._id, card: cardData._id}, function(err, pair) {
			if (err) { res.send('error'); return; }
			res.send('ok');
		});
	});
};

exports.cardsCollection = async function(req, res, next) {
	var [err, userId] = await getUserId(req.user, req.params.username);
	if (err) { return next(err); }
	if (req.user && req.user.name === req.params.username) {
		var title = 'My Collection';
	} else {
		var title = req.params.username + "'s Collection";
	}
	CardsCollection.find({'user': userId})
		.populate('card')
		.exec(function (err, cardsList) {
			if (err) { return next(err); }
			cardsList = cardsList.map(pair => pair.card);
			cardsList.sort(sortByRarityAndNumber);
			res.render('cardsList', { title: title, cardsList: cardsList, user: req.user, path: 'collection' });
	});
};

async function getUserId(currentUser, requestedUsername) {
	var userQuery = Users.findOne({ 'name': requestedUsername });
	if (currentUser && currentUser.name === requestedUsername) {
		return [null, currentUser._id];
	}
	else {
		try {
			var user = await userQuery.exec();
		} catch(err) {
			return [err, null];
		}
		if (!user) {
			var err = new Error('User not found');
			return [err, null];
		}
		return [null, user._id];
	}
}

exports.getOwnedCards = function(req, res) {
	CardsCollection.find({'user': req.user._id})
		.populate('card')
		.exec(function (err, cardsList) {
			if (err) { return next(err); }
			var cardNames = cardsList.map(userCard => userCard.card.uniqueName);
			res.send(cardNames);
	});
};

exports.updateOwnedCards = function(req, res) {
	Cards.find({uniqueName: {"$in": Object.keys(req.body.changedCards)}}, 'uniqueName', function(err, cards) {
		if (err) { res.send('error'); return; }
		if (!cards) { res.send('error'); return; }

		var addedCards = [];
		var removedCards = [];

		for (let key in req.body.changedCards) {
			if (req.body.changedCards[key]) {
				addedCards.push(new CardsCollection({user: req.user._id, card: cards.find(card => card.uniqueName === key)._id}));
			} else {
				removedCards.push(cards.find(card => card.uniqueName === key)._id);
			}
		}
		var addPromise = CardsCollection.insertMany(addedCards);
		var removePromise = CardsCollection.deleteMany({user: req.user._id, card: removedCards}).exec();

		Promise.all([addPromise, removePromise]).then(value => {
			res.sendStatus(200);
		}).catch(err => {
			res.send('error');
		});
	});
};

exports.editCard = function(req, res, next) {
	Cards.findOne({uniqueName: req.params.id}, async function(err, cardData) {
		if (err) { return next(err); }
		if (!cardData) {
			var err = new Error('Card not found');
			return next(err);
		}

		res.render('cardEdit', { title: 'Edit Card', card: cardData, user: req.user });
	});
};

exports.updateCard = async function(req, res, next) {
	var originalUniqueName = req.body.cardData.originalUniqueName;
	var newUniqueName = req.body.cardData.uniqueName;

	if (originalUniqueName === '' || originalUniqueName !== newUniqueName) {
		var [err, nameExists] = await isNameUnique(newUniqueName);
		if (err) {
			res.json({ err: true, message: err.message });
			return;
		}
		if (nameExists) {
			res.json({ err: true, message: 'Unique name is already used by another card' });
			return;
		}
	}

	try {
		await Cards.findOneAndUpdate({uniqueName: originalUniqueName}, req.body.cardData);

		var promiseL = saveImage(originalUniqueName, newUniqueName, req.body.cardData.images.L, 'L', false);
		var promiseLB = saveImage(originalUniqueName, newUniqueName, req.body.cardData.images.LB, 'L', true);
		var promiseS = saveImage(originalUniqueName, newUniqueName, req.body.cardData.images.S, 'S', false);

		Promise.all([promiseL, promiseLB, promiseS])
			.then(() => { res.json({ err: null, message: 'Success' }); })
			.catch(reason => { res.json({ err: true, message: reason.message }); });

	} catch (err) {
		res.json({ err: true, message: err.message });
		return;
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
	const ext = baseImage.substring(baseImage.indexOf("/")+1, baseImage.indexOf(";base64"));
    const fileType = baseImage.substring("data:".length,baseImage.indexOf("/"));
    const regex = new RegExp(`^data:${fileType}\/${ext};base64,`, 'gi');
    const base64Data = baseImage.replace(regex, "");
    const imageData = new Buffer(base64Data, 'base64');
    const imagePath = './public/images/cards/' + cardSize + '/' + name + (isBoomed?'_b':'') + '.jpg';
    
    return new Promise((resolve, reject) => {
	    fs.writeFile(imagePath, imageData, err => {
	    	if (err) reject(err);
	    	resolve();
	    });
	});
}