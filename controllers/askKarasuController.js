const createError = require("http-errors");
const Sentry = require("@sentry/node");

const cardService = require("../services/cardService");
const userService = require("../services/userService");

const skillCharge = require("../data/speed.json");

// TODO: REFACTOR!!
exports.getAskKarasuPage = async function (req, res, next) {
	try {
		let cards = [], item = "???", q = req.params.question;
		let dict = {
			"dt_rewards": {
				'dt.reward': req.query.item
			},
			"card_unlock_items": {
				'dt.requirements.name': req.query.item
			},
			"majolish_cards": {
				'dt.type': req.query.item
			},
			"skill_charge_speed": {}
		};

		if (req.params.question in dict === false) {
			throw createError(404);
		}

		speed = q === "skill_charge_speed";

		if (!speed && req.query.item && req.query.item !== "") {
			cards = await cardService.getCardsWithItem({
				"$match": dict[q]
			});
			item = req.query.item;
		}

		if (speed && req.query.speed && (req.query.speed === "fast" || req.query.speed === "slow")) {
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
			title: req.i18n.t("title." + q, { "item": item.replace('_', ' ') }),
			description: "",
			cards: cards,
			path: q,
			query: req.query,
			user: req.user
		});
	} catch (e) {
		Sentry.captureException(e);
		return next(e);
	}
};
