const createError = require("http-errors");

const async = require("async");
const fs = require("fs");
const nodeHtmlToImage = require("node-html-to-image");
const i18next = require("i18next");
const Sentry = require('@sentry/node');

const cardService = require("../services/cardService");
const userService = require("../services/userService");
const fileService = require("../services/fileService");

exports.index = function (req, res, next) {
	return res.render("index", {
		title: "Karasu OS",
		description: i18next.t("description.cards"),
		user: req.user
	});
};

exports.getCardsListPage = async function(req, res, next) {
	try {
		var query = getCardsQuery(req.query);
		var cards = await cardService.getCards(query);
		cards = stripeExcessData(cards);

		if (req.user && req.query.cards) {
			let ownedCards = await userService.getOwnedCards(req.user.name);
			if (req.query.cards === 'owned') {
				cards = cards.filter(card => ownedCards.includes(card.uniqueName))
			} else if (req.query.cards === 'notowned') {
				cards = cards.filter(card => !ownedCards.includes(card.uniqueName))
			}
		}

		return res.render("cardsList", {
			title: i18next.t("title.cards"),
			description: "The place to view all of Obey Me!'s cards. The largest and most complete card databse with all sorts of filters for you to find the card you want! This is also the place to manage your card collection. Create an account to access more features! ... Pride, Greed, Envy, Wrath, Lust, Gluttony, Sloth, UR+, UR, SSR, SR, N, Lucifer, Mammon, Leviathan, Satan, Asmodeus, Beelzebub, Belphegor, Luke, Simeon, Barbatos, Diavolo, Solomon, Little D., Owned, Not owned.",
			cardsList: cards,
			path: "list",
			query: req.query,
			user: req.user
		});
	} catch(e) {
		return next(e);
	}
};

exports.getOwnedCardsPage = async function(req, res, next) {
	try {
		var user = await userService.getUser(req.params.username);
		if (!user) {
			throw createError(404, "User not found");
		}

		var pageParams = {
			description: `${req.params.username}'s Collection on Karasu-OS.com`,
			path: "collection",
			user: req.user
		};

		var isCollectionOwner = req.user && req.user.name === user.info.name;
		pageParams.title = isCollectionOwner ? i18next.t("title.my_collection") : i18next.t("title.user_collection", { username: user.info.name });

		var isPrivate = user.profile.isPrivate && !isCollectionOwner;
		if (isPrivate) {
			pageParams.isPrivate = true;
		} else {
			var allCards = await cardService.getCards();
			var ownedCards = await userService.getOwnedCards(user.info.name);
			pageParams.cardsList = ownedCards;

			pageParams.ownedStats = cardService.getCollectionStats(ownedCards);
			pageParams.totalStats = cardService.getCollectionStats(allCards);

			for ([category, entries] of Object.entries(pageParams.totalStats)) {
				for (entry in entries) {
					pageParams.ownedStats[category][entry] = pageParams.ownedStats[category][entry] || 0;
				}
			}
		}

		return res.render('cardsList', pageParams);
	} catch (e) {
		return next(e);
	}
};

exports.getFavouriteCardsPage = async function(req, res, next) {
	try {
		var user = await userService.getUser(req.params.username);
		if (!user) {
			throw createError(404, "User not found");
		}

		var pageParams = {
			description: `${req.params.username}'s favourite Obey Me cards on Karasu-OS.com`,
			path: "fav",
			user: req.user
		};

		var isCollectionOwner = req.user && req.user.name === user.info.name;
		pageParams.title = isCollectionOwner ? i18next.t("title.my_favourites") : i18next.t("title.user_favourites", { username: user.info.name });

		var isPrivate = user.profile.isPrivate && !isCollectionOwner;
		if (isPrivate) {
			pageParams.isPrivate = true;
		} else {

			var favedCards = await userService.getFaveCards(user.info.name);
			pageParams.cardsList = favedCards;
		}

		return res.render("cardsList", pageParams);
	} catch (e) {
		return next(e);
	}
};

exports.getCardDetailPage = async function(req, res, next) {
	try {
		var cardName = cardService.decodeCardName(req.params.card);
		var uniqueName = await cardService.getUniqueName(cardName);
		var cardData = await cardService.getCard(uniqueName);
		if (!cardData) {
			return await getHiddenCardDetailPage(req, res, next);
		}

		var stats = await cardService.getCardStats(req.user, uniqueName);

		var title = cardData.name;
		var lang = i18next.t("lang");
		if (lang === "ja" && cardData.ja_name != "???") {
			title = cardData.ja_name;
		}

		return res.render('cardDetail', {
			title: title,
			description: `View "${cardData.name}" and other Obey Me cards on Karasu-OS.com`,
			card: cardData,
			isHidden: false,
			user: req.user,
			stats: stats
		});
	} catch (e) {
		return next(e);
	}
};

async function getHiddenCardDetailPage(req, res, next) {
	var cardName = req.params.card.replace(/_/g, ' ');
	var cardData = await cardService.getHiddenCard(cardName, req.user);
	if (!cardData) {
		throw createError(404, "Card not found");
	}
	return res.render('cardDetail', {
		title: cardData.name,
		description: `View "${cardData.name}" and other Obey Me cards on Karasu-OS.com`,
		card: cardData,
		isHidden: true,
		user: req.user
	});
}

exports.getHiddenCardsListPage = async function(req, res, next) {
	try {
		var cards = await cardService.getHiddenCards();
		return res.render('cardsList', { title: 'Hidden Cards', cardsList: cards, user: req.user, path: 'hidden' });
	} catch(e) {
		return next(e);
	}
};

exports.getProfilePage = async function(req, res, next) {
	try {
		var user = await userService.getUser(decodeURIComponent(req.params.username));
		if (!user) {
			throw createError(404, "User not found");
		}

		if (req.user && req.user.name === user.info.name) {
			var title = i18next.t("title.my_profile");
		} else {
			var title = i18next.t("title.user_profile", { username: user.info.name });
		}

		var cards = {
		  owned: (await userService.getOwnedCards(user.info.name)).slice(0, 15),
		  faved: (await userService.getFaveCards(user.info.name)).slice(0, 15)
		};

		var profileInfo = await userService.getProfileInfo(user.info.name);

		res.render("profile", {
			title: title,
			description: `See ${user.info.name}'s profile on Karasu-OS.com`,
			user: req.user,
			profileInfo: profileInfo,
			cards: cards
		});
	} catch (e) {
		return next(e);
	}
};

exports.directImage = async function (req, res, next) {
	var cardName = req.url.substring(1).replace('_b.jpg', '').replace('.jpg', '');
	cardName = cardService.decodeCardName(cardName);
	var isHidden = await cardService.isHidden(cardName);
	if (isHidden && (!req.user || !req.user.isAdmin)) {
		return next(new Error('Not found'));
	}
	next();
}


// Collection functions
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

exports.getCards = async function (req, res) {
	try {
		var query = getCardsQuery(req.query);
		var cards = await cardService.getCards(query);
		cards = stripeExcessData(cards);
		return res.json({ err: null, cards: cards });
	} catch(e) {
		return res.json({ err: true, message: e.message });
	}
}

// Admin card management
exports.getEditCardPage = async function(req, res, next) {
	if (!req.params.card) {
		return res.render('cardEdit', { title: 'Add Card', user: req.user });
	}

	try {
		var cardData = await cardService.getCard(req.params.card);

		if (!cardData) {
			throw createError(404, "Card not found");
		}

		return res.render('cardEdit', { title: 'Edit Card', card: cardData, user: req.user });
	} catch (e) {
		console.error(e.message);
		Sentry.captureException(e);
		next(e);
	}
};

exports.updateCard = async function(req, res, next) {
	var result = await cardService.updateCard(req.body.cardData);
	return res.json(result);
};

exports.deleteCard = async function (req, res, next) {
	try {
		var result = await cardService.deleteCard(req.body.card);
		return res.json(result);
	} catch (e) {
		// console.error(e.message);
		Sentry.captureException(e);
		return res.json({ err: e });
	}
};

exports.makeCardPublic = async function (req, res, next) {
	try {
		var newCard = await cardService.makeCardPublic(req.params.card);
		res.redirect("/card/"+ cardService.encodeCardName(newCard.name));
	} catch (e) {
		console.error(e.message);
		Sentry.captureException(e);
		next(e);
	}
};

/* helper */
function getCardsQuery(obj) {
	var query = {};
	for (let [key, value] of Object.entries(obj)) {
		if (value === "") continue;
		if (["characters", "attribute", "rarity"].includes(key)) {
			query[key] = { $in: [].concat(value) };
		} else if (key === "search") {
			// var lang = i18next.t("lang") === "zh" ? "en" : i18next.t("lang");
			// query["name."+lang] = new RegExp(value, 'i');

			if (i18next.t("lang") === "ja") {
				query["ja_name"] = new RegExp(value, 'i');
			} else {
				query["name"] = new RegExp(value, 'i');
			}
		}
	}
	return query;
}

// better way to do this ?
function stripeExcessData(cards) {
	return cards.map(card => {
		return {
			name: i18next.t("lang") === "ja" ? card.ja_name : card.name,
			uniqueName: card.uniqueName,
			type: card.type
		}
	});
}
