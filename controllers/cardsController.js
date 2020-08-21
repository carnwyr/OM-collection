const Cards = require('../models/cards');
const CardsCollection = require('../models/cardsCollection');

const async = require('async');
const fs = require('fs');

exports.index = function(req, res, next) {
	Cards.countDocuments({}, function(err, result) {
		if (err) { return next(err); }
		res.render('index', { title: 'Cards collection', data: result, user: req.user });
	});
};

// Display all the cards
exports.cardsList = function(req, res, next) {
	Cards.find({}, 'name uniqueName type rarity number attribute characters', function (err, listCards) {
		if (err) { return next(err); }
		listCards.sort(function(a, b) {
			var rarityOrder = -1 * compareByRarity(a.rarity, b.rarity);
			if (rarityOrder != 0)
				return rarityOrder;
			if (a.number > b.number) {
				return -1;
			}
			if (a.number < b.number) {
				return 1;
			}
			return 0;
		});
		res.render('cardsList', { title: 'Cards List', cardsList: listCards, user: req.user, path: 'list' });
	});
};

// Display detailed card's page
exports.cardsDetail = function(req, res, next) {
	Cards.findOne({uniqueName: req.params.id}, function(err, result) {
		if (err) { return next(err); }
		if (result==null) { // No results.
			var err = new Error('Card not found');
			err.status = 404;
			return next(err);
		}

		var hasCard = false;

		CardsCollection.findOne({user: req.user._id, card: result._id}, function(err, pair) {
			if (err) { return next(err); }
			if (pair) { hasCard = true; }
			res.render('cardDetail', { title: 'Card Details', card: result, user: req.user, hasCard: hasCard });
		});
	});
};

exports.cardAddToCollection = function(req, res) {
	Cards.findOne({uniqueName: req.params.id}, function(err, result) {
		if (err) { res.send('error'); return; }
		if (result==null) { res.send('no card'); return; }

		var pair = CardsCollection({
			user: req.user._id,
			card: result._id
		});
		pair.save(function (err) {
			if (err) { res.send('error'); return; }
			res.send('ok');
		});
	});
};

exports.cardRemoveFromCollection = function(req, res) {
	Cards.findOne({uniqueName: req.params.id}, function(err, result) {
		if (err) { res.send('error'); return; }
		if (!result) { res.send('no card'); return; }

		CardsCollection.deleteOne({user: req.user._id, card: result._id}, function(err, pair) {
			if (err) { res.send('error'); return; }
			res.send('ok');
		});
	});
};

// Display user's cards
exports.cardsCollection = function(req, res, next) {
	CardsCollection.find({'user': req.user._id})
		.populate('card')
		.exec(function (err, listCards) {
			if (err) { return next(err); }
			listCards = listCards.map(pair => pair.card);
			listCards.sort(function(a, b) {
				var rarityOrder = -1 * compareByRarity(a.rarity, b.rarity);
				if (rarityOrder != 0)
					return rarityOrder;
				if (a.number > b.number) {
					return -1;
				}
				if (a.number < b.number) {
					return 1;
				}
				return 0;
			});
			res.render('cardsList', { title: 'My Collection', cardsList: listCards, user: req.user, path: 'collection' });
	});
};

// Display a form to add cards by GET request
exports.cardsCreateGet = function(req, res) {
	res.render('cardCreate', { title: 'Add new cards', user: req.user });
};

// Create a card by POST request
exports.cardsCreatePost = function(req, res, next) {
	if (!req.file) {
		req.flash('message', 'Error receiving file')
		res.render('cardCreate', { title: 'Add new cards', user: req.user, message:  req.flash('message')});
	} else {
		fs.readFile(req.file.path, 'utf8', function (err, data) {
			fs.unlink(req.file.path, (err) => {
				return next(err)
			});
			if (err) { return next(err); }
			var cards = JSON.parse(data);
			for (var i=0; i < cards.list.length; i++) {
				Cards.findOne({uniqueName: cards.list[i].uniqueName}, function(err, result) {
					if (err) { return next(err); }
					if (!result) {
						var newCard = new Cards({
							name: cards.list[i].name,
							uniqueName: cards.list[i].uniqueName,
							type: cards.list[i].type,
							rarity: cards.list[i].rarity,
							attribute: cards.list[i].attribute,
							characters: cards.list[i].characters,
						});
						newCard.save(function (err) {
							if (err) {return next(err); }
							req.flash('message', 'Cards added successfully')
							res.render('cardCreate', { title: 'Add new cards', user: req.user, message:  req.flash('message')});
						});
					}
				});
			}
		});
	}
};

// Display a form to delete a card by GET request
exports.cardsDeleteGet = function(req, res) {
	res.send('NOT IMPLEMENTED: Card delete GET');
};

// Delete a card by POST request
exports.cardsDeletePost = function(req, res) {
	res.send('NOT IMPLEMENTED: Card delete POST');
};

// Display a form to update a card by GET request
exports.cardsUpdateGet = function(req, res) {
	res.send('NOT IMPLEMENTED: Card update GET');
};

// Update a card by POST request
exports.cardsUpdatePost = function(req, res) {
	res.send('NOT IMPLEMENTED: Card update POST');
};

exports.getOwnedCards = function(req, res) {
	CardsCollection.find({'user': req.user._id})
		.populate('card')
		.exec(function (err, listCards) {
			if (err) { return next(err); }
			var cardNames = listCards.map(userCard => userCard.card.uniqueName);
			res.send(cardNames);
	});
};

exports.updateOwnedCards = function(req, res) {
	Cards.find({uniqueName: {"$in": Object.keys(req.body.changedCards)}}, 'uniqueName', function(err, result) {
		if (err) { res.send('error'); return; }
		if (result==null) { res.send('error'); return; }

		var newCards = [];
		for (let key in req.body.changedCards) {
			if (!req.body.changedCards[key]) {
				continue;
			}
			newCards.push(new CardsCollection({user: req.user._id, card: result.find(card => card.uniqueName === key)._id}));
		}
		var addPromise = CardsCollection.insertMany(newCards);
		
		var removedCards = [];
		for (let key in req.body.changedCards) {
			if (req.body.changedCards[key])
				continue;
			removedCards.push(result.find(card => card.uniqueName === key)._id);
		}
		var removePromise = CardsCollection.deleteMany({user: req.user._id, card: removedCards}).exec();

		Promise.all([addPromise, removePromise]).then(value => {
			res.sendStatus(200);
		}).catch(err => {
			res.send('error');
			console.log(err)
		});
	});
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
}