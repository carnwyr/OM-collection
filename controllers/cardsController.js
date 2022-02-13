const createError = require("http-errors");
const async = require("async");
const fs = require("fs");
const i18next = require("i18next");
const Sentry = require("@sentry/node");

const cardService = require("../services/cardService");
const eventService = require("../services/eventService");
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
		var cards = await cardService.getCards();
		return res.render("cardsList", {
			title: i18next.t("title.cards"),
			description: "The place to view all of Obey Me!'s cards. The largest and most complete card databse with all sorts of filters for you to find the card you want! This is also the place to manage your card collection. Create an account to access more features! ... Pride, Greed, Envy, Wrath, Lust, Gluttony, Sloth, UR+, UR, SSR, SR, N, Lucifer, Mammon, Leviathan, Satan, Asmodeus, Beelzebub, Belphegor, Luke, Simeon, Barbatos, Diavolo, Solomon, Little D., Owned, Not owned.",
			cardsList: cards,
			path: "list",
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

		return res.render("cardsList", pageParams);
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
		var cardData = await cardService.getCard({ "name": req.params.card.replace(/_/g, " ") });
		if (!cardData) {
			return await getHiddenCardDetailPage(req, res, next);
		}

		var stats = await cardService.getCardStats(req.user, cardData.uniqueName);

		cardData.source_link = cardData.source.map(x => encodeURIComponent(x.replace(/ /g, "_")));

		var title = cardData.name;
		var lang = i18next.t("lang");

		if (lang === "ja") {
			if (cardData.ja_name !== "???") {
				title = cardData.ja_name;
			}

			cardData.source = await getSourceInLanguage(cardData.source, "ja");
		}

		return res.render("cardDetail", {
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

async function getSourceInLanguage(sources, lng) {
	var arr = [];
	for (const source of sources) {
		// temporary exceptions
		switch (source) {
			case "Chapter M":
				arr.push("Mの章");
				break;
			case "Chapter A":
				arr.push("Aの章");
				break;
			case "Chapter G":
				arr.push("Gの章");
				break;
			default: {
				let relatedEvent = await eventService.getEvent({ "name.en": source });
				if (!relatedEvent) {
					arr.push(source);
				} else if (relatedEvent.name[lng] !== "???" && relatedEvent.name[lng] !== "") {
					arr.push(relatedEvent.name.ja);
				}
			}
		}
	}
	return arr;
}

async function getHiddenCardDetailPage(req, res, next) {
	var cardName = req.params.card.replace(/_/g, " ");
	var cardData = await cardService.getHiddenCard(cardName, req.user);
	if (!cardData) {
		throw createError(404, "Card not found");
	}
	cardData.source_link = cardData.source.map(x => encodeURIComponent(x.replace(/ /g, "_")));
	return res.render("cardDetail", {
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
		return res.render("cardsList", { title: "Hidden Cards", cardsList: cards, user: req.user, path: "hidden" });
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

		var title;
		if (req.user && req.user.name === user.info.name) {
			title = i18next.t("title.my_profile");
		} else {
			title = i18next.t("title.user_profile", { username: user.info.name });
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
	var cardName = req.url.substring(1).replace("_b.jpg", "").replace(".jpg", "");
	cardName = cardService.decodeCardName(cardName);
	var isHidden = await cardService.isHidden(cardName);
	if (isHidden && (!req.user || !req.user.isAdmin)) {
		return next(new Error("Not found"));
	}
	next();
};


// Collection functions
exports.getAvailableCards = async function (req, res) {
	var cards = await cardService.getCards();
	var lang = i18next.t("lang");
	cards = cards.map(card => {
		return {
			name: lang === "ja" ? card.ja_name : card.name,
			uniqueName: card.uniqueName
		};
	});
	return res.send(cards);
};

// Admin card management
exports.getEditCardPage = async function(req, res, next) {
	if (!req.params.card) {
		return res.render("cardEdit", { title: "Add Card", user: req.user });
	}

	try {
		var cardData = await cardService.getCard({ uniqueName: req.params.card });

		if (!cardData) {
			throw createError(404, "Card not found");
		}

		return res.render("cardEdit", { title: "Edit Card", card: cardData, user: req.user });
	} catch (e) {
		console.error(e.message);
		Sentry.captureException(e);
		next(e);
	}
};

exports.addNewCard = async function(req, res) {
	var result = await cardService.addNewCard(req.body.cardData, req.body.images);
	return res.json(result);
};

exports.updateCard = async function(req, res) {
	var data = {
		originalUniqueName: req.params.card,
		cardData: req.body.cardData,
		images: req.body.images
	};
	var result = await cardService.updateCard(data);
	return res.json(result);
};

exports.deleteCard = async function (req, res) {
	try {
		var result = await cardService.deleteCard(req.body.card);
		return res.json(result);
	} catch (e) {
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
