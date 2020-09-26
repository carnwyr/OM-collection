const Cards = require('../models/cards');
const CardsCollection = require('../models/cardsCollection');
const Users = require('../models/users.js');
const HiddenCards = require('../models/hiddenCards.js');

const async = require('async');
const fs = require('fs');

var usersController = require('../controllers/usersController');

exports.index = function(req, res, next) {
	res.render('index', { title: 'Cards collection', user: req.user });
};

exports.cardsList = function(req, res, next) {
	Cards.find({}, 'name uniqueName type rarity number attribute characters', function (err, cardsList) {
		if (err) { return next(err); }
		cardsList.sort(sortByRarityAndNumber);
		res.render('cardsList', { title: 'Gallery', cardsList: cardsList, user: req.user, path: 'list' });
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
			if (req.user && req.user.isAdmin) {
				HiddenCards.findOne({uniqueName: req.params.id}, function(err, cardData) {
					if (err) { return next(err); }
					if (!cardData) {
						var err = new Error('Card not found');
						return next(err);
					}
					return res.render('cardDetail', { title: cardData.name, card: cardData, user: req.user, hasCard: false, isHidden: true });
				});
			} else {
				var err = new Error('Card not found');
				return next(err);
			}
		} else {
			if (req.user) {
				var [err, hasCard] = await isCardInCollection(req.user.name, req.params.id);
				if (err) { return next(err); }
			}
			res.render('cardDetail', { title: cardData.name, card: cardData, user: req.user, hasCard: hasCard, isHidden: false  });
		}
	});
};

async function isCardInCollection(user, card) {
	var collectionQuery = CardsCollection.findOne({user: user, card: card});
	try {
		var pair = await collectionQuery.exec();
	} catch(err) {
		return [err, null];
	}
	var hasCard = pair ? true : false;
	return [null, hasCard];
}

exports.addToCollection = function(req, res) {
	var pair = CardsCollection({
		user: req.user.name,
		card: req.params.id
	});
	pair.save(function (err) {
		if (err) { res.send('error'); return; }
		res.send('ok');
	});
};

exports.removeFromCollection = function(req, res) {
	CardsCollection.deleteOne({user: req.user.name, card: req.params.id}, function(err, pair) {
		if (err) { res.send('error'); return; }
		res.send('ok');
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
	};

	if (req.user && req.user.name === req.params.username) {
		var title = 'My Collection';
	} else {
		var title = req.params.username + "'s Collection";
	}
	CardsCollection.find({user: req.params.username}, function (err, collection) {
		if (err) { return next(err); }
		let ownedCards = collection.map(pair => pair.card);
		Cards.find({uniqueName: {"$in": ownedCards}}, function(err, cardsList) {
			if (err) { return next(err); }
			cardsList.sort(sortByRarityAndNumber);

			// chard -> card characters
			Cards.find({}, 'characters', function (err, chard) {
				if (err) { return next(err); }
				chard.forEach(el => {
					el.characters.forEach(i => {
						if (cardStats[i]) {
							cardStats[i][1] += 1;
							console.log(cardStats[i][1], el.characters)
						} else {
							console.log(chard) // error in characters array
						}
					});
				});

				for (var key in cardStats) {
					cardStats[key][0] = cardsList.filter(card => card.characters.includes(key)).length;
				}

				res.render('cardsList', { title: title, cardsList: cardsList, cardStats: cardStats, user: req.user, path: 'collection' });
			});
		});
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
		console.log(isHidden)
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

		var promiseCollection = CardsCollection.deleteMany({card: card.uniqueName}).exec();
		var promiseL = deleteFile('./public/images/cards/L/'+cardName+'.jpg');
		var promiseLB = deleteFile('./public/images/cards/L/'+cardName+'_b.jpg');
		var promiseS = deleteFile('./public/images/cards/S/'+cardName+'.jpg');

		Promise.all([promiseCollection, promiseL, promiseLB, promiseS])
			.then(() => { return res.redirect('/cards'); })
			.catch(reason => { return next(err); });
	});
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
