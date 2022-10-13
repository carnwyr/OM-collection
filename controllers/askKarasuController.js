const createError = require("http-errors");

const cardService = require("../services/cardService");
const userService = require("../services/userService");

const skillCharge = require("../staticData/skills.json");

// TODO: merge ?
exports.getDTRewardsPage = async function (req, res, next) {
	let cards = [];
	let item = "???";
	let title = "Devil's Tree Rewards";
	if (req.query.item) {
		/*if (req.user && (req.query.owned || req.query.locked)) {
			let user = await userService.getUser(req.user.name);
	
			if (req.query.owned) {
				cards = cards.filter(x => user.cards.owned.includes(x.uniqueName));
			}
	
			if (req.query.locked) {
				cards = cards.filter(x => !user.tree.includes(x.dt._id));
			}
		}*/

		cards = await cardService.getCardsWithItem(req.query.item, req.user, req.query.owned, req.query.locked);
		item = req.query.item;
		console.log(cards)
	}

	return res.render("askKarasu", {
		title: title,
		description: "A page with list of cards that gives " + item + " in their devil's trees.",
		cards: cards,
		path: "dt_rewards",
		query: req.query,
		user: req.user
	});
};

exports.getUnlockItemsPage = async function (req, res, next) {
	try {
		let cards = [], item = "???", title = "Items to Unlock Devil's Tree";
		if (req.query.item && req.query.item !== "") {
			cards = await cardService.getCardsWithItem({
				"$match": { 'dt.requirements.name': req.query.item }
			});
			item = req.query.item;
			title += ": " + item;
		}

		if (req.user) {
			let user = await userService.getUser(req.user.name);

			if (req.query.owned === "on") {
				cards = cards.filter(x => user.cards.owned.includes(x.uniqueName));
			}

			if (req.query.locked === "on") {
				cards = cards.filter(x => !user.tree.includes(x.dt._id));
			}
		}

		return res.render("askKarasu", {
			title: title,
			description: "A list of cards that needs " + item + " to unlock their devil's tree spaces.",
			cards: cards,
			path: "card_unlock_items",
			query: req.query,
			user: req.user
		});
	} catch(e) {
		Sentry.captureException(e);
		return next(e);
	}
};

exports.getMajolishCardsPage = async function (req, res, next) {
	try {
		let cards = [], item = "???", title = "Majolish Rewards";
		if (req.query.item && req.query.item !== "") {
			cards = await cardService.getCardsWithItem({
				"$match": { 'dt.type': req.query.item }
			});
			item = req.query.item;
			title += ": " + item;
		}

		if (req.user) {
			let user = await userService.getUser(req.user.name);

			if (req.query.owned === "on") {
				cards = cards.filter(x => user.cards.owned.includes(x.uniqueName));
			}

			if (req.query.locked === "on") {
				cards = cards.filter(x => !user.tree.includes(x.dt._id));
			}
		}

		return res.render("askKarasu", {
			title: title,
			description: "A list of cards with " + item + " in as a devil's tree reward.",
			cards: cards,
			path: "majolish_cards",
			query: req.query,
			user: req.user
		});
	} catch(e) {
		Sentry.captureException(e);
		return next(e);
	}
};

exports.getSkillChargeSpeedPage = async function (req, res, next) {
	try {
		let cards = [], item = "???", title = "Fast/slow Charging Cards";

		if (req.query.speed && (req.query.speed === "fast" || req.query.speed === "slow")) {
			cards = await cardService.getCards({
				"skills.description": { "$in": skillCharge[req.query.speed] },
				"rarity": { "$in": ["SSR", "UR", "UR+"] }  // SR and below have duplicate skills with different charging time..
			}, { 'name': 1, 'uniqueName': 1 });
			item = req.query.speed;
			title = item.charAt(0).toUpperCase() + item.slice(1) + " Charging Cards";
		}

		if (req.user && req.query.owned === "on") {
			let user = await userService.getUser(req.user.name);
			cards = cards.filter(x => user.cards.owned.includes(x.uniqueName));
		}

		return res.render("askKarasu", {
			title: title,
			description: "A list of " + item + " charging cards.",
			cards: cards,
			path: "skill_charge_time",
			query: req.query,
			user: req.user
		});
	} catch (e) {
		Sentry.captureException(e);
		return next(e);
	}
};

exports.getSkillsPage = async function (req, res, next) {
	try {
		let cards = [], item = "???";

		if (req.query.s && req.query.s !== "") {
			cards = await cardService.findSkills(req.query.s);
			item = req.query.speed;
		}

		if (req.user && req.query.owned === "on") {
			let user = await userService.getUser(req.user.name);
			cards = cards.filter(x => user.cards.owned.includes(x.uniqueName));
		}

		return res.render("askKarasu", {
			title: req.i18n.t("title.skills"),
			description: "",
			cards: cards,
			path: "skills",
			query: req.query,
			user: req.user
		});
	} catch (e) {
		Sentry.captureException(e);
		return next(e);
	}
};
