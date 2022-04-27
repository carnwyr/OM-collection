const createError = require("http-errors");
const Sentry = require("@sentry/node");

const cardService = require("../services/cardService");
const userService = require("../services/userService");

const skillCharge = require("../data/speed.json");

// TODO: merge ?
exports.getDTRewardsPage = async function (req, res, next) {
	try {
		let cards = [], item = "???";
		if (req.query.item && req.query.item !== "") {
			cards = await cardService.getCardsWithItem({
				"$match": { 'dt.reward': req.query.item }
			});
			item = req.query.item;
		}

		if (req.user && req.query.owned === "on") {
			let user = await userService.getUser(req.user.name);
			cards = cards.filter(x => user.cards.owned.includes(x.uniqueName));
		}

		return res.render("askKarasu", {
			title: req.i18n.t("title.dt_rewards", { "item": item.replace('_', ' ') }),
			description: "",
			cards: cards,
			path: "dt_rewards",
			query: req.query,
			user: req.user
		});
	} catch(e) {
		Sentry.captureException(e);
		return next(e);
	}
};

exports.getUnlockItemsPage = async function (req, res, next) {
	try {
		let cards = [], item = "???";
		if (req.query.item && req.query.item !== "") {
			cards = await cardService.getCardsWithItem({
				"$match": { 'dt.requirements.name': req.query.item }
			});
			item = req.query.item;
		}

		if (req.user && req.query.owned === "on") {
			let user = await userService.getUser(req.user.name);
			cards = cards.filter(x => user.cards.owned.includes(x.uniqueName));
		}

		return res.render("askKarasu", {
			title: req.i18n.t("title.card_unlock_items", { "item": item.replace('_', ' ') }),
			description: "",
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
		let cards = [], item = "???";
		if (req.query.item && req.query.item !== "") {
			cards = await cardService.getCardsWithItem({
				"$match": { 'dt.type': req.query.item }
			});
			item = req.query.item;
		}

		if (req.user && req.query.owned === "on") {
			let user = await userService.getUser(req.user.name);
			cards = cards.filter(x => user.cards.owned.includes(x.uniqueName));
		}

		return res.render("askKarasu", {
			title: req.i18n.t("title.majolish_cards", { "item": item.replace('_', ' ') }),
			description: "",
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
		let cards = [], item = "???";

		if (req.query.speed && (req.query.speed === "fast" || req.query.speed === "slow")) {
			cards = await cardService.getCards({
				"skills.description": { "$in": skillCharge[req.query.speed] },
				"rarity": { "$in": ["SSR", "UR", "UR+"] }  // SR and below have duplicate skills with different charging time..
			}, { 'name': 1, 'uniqueName': 1 });
			item = req.query.speed;
		}

		if (req.user && req.query.owned === "on") {
			let user = await userService.getUser(req.user.name);
			cards = cards.filter(x => user.cards.owned.includes(x.uniqueName));
		}

		return res.render("askKarasu", {
			title: req.i18n.t("title.skill_charge_time", { "item": item.replace('_', ' ') }),
			description: "",
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
