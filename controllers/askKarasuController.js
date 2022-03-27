const createError = require("http-errors");
const Sentry = require("@sentry/node");

const cardService = require("../services/cardService");
const userService = require("../services/userService");

exports.getAskKarasuPage = async function (req, res, next) {
	try {
		let cards = [], item = "???", q = req.params.question;
		let dict = {  // todo: do something with this so it doesn't keep getting larger
			"dt_rewards": {
				'dt.reward': req.query.item
			},
			"card_unlock_items": {
				'dt.requirements.name': req.query.item
			},
			"majolish_cards": {
				'dt.type': req.query.item
			}
		};

		if (req.params.question in dict === false) {
			throw createError(404);
		}

		if (req.query.item && req.query.item !== "") {
			cards = await cardService.getCardsWithItem({
				"$match": dict[q]
			});
			item = req.query.item;
		}

		if (req.user && req.query.owned === "on") {
			let user = await userService.getUser(req.user.name);
			cards = cards.filter(x => user.cards.owned.includes(x.uniqueName));
		}

		return res.render("askKarasu", {
			title: req.i18n.t("title." + q, { "item": item }),
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
