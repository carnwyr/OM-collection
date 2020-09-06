const Cards = require('../models/cards');
const CardsCollection = require('../models/cardsCollection');
const Users = require('../models/users.js');

const async = require('async');

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