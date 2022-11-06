const https = require("https");
const createError = require("http-errors");
const cacheService = require("../services/cacheService");
const cardService = require("../services/cardService");

exports.privacyPolicy = function(req, res, next) {
	return res.render("policies", { title: "Privacy Policy", user: req.user });
};

exports.surpriseGuest = async function(req, res, next) {
	try {
		let c = ["Lucifer", "Mammon", "Leviathan", "Satan", "Asmodeus", "Beelzebub", "Belphegor", "Diavolo", "Barbatos", "Simeon", "Luke", "Solomon"];
		let character = req.params.character;
		if (character && !c.includes(character)) return next(createError(404, "Character not found."));

		character = character ? req.i18n.t(character) + req.i18n.t("de") : "";

		return res.render("surpriseGuest", {
			title: character + req.i18n.t("common.spg"),
			description: "An all-in-one guide for Obey Me! surprise guest interactions. Karasu's interactive guide features all characters including the demon brothers and side characters. ... Lucifer, Mammon, Leviathan, Satan, Asmodeus, Beelzebub, Belphegor, Luke, Simeon, Barbatos, Diavolo, Solomon.",
			user: req.user, interactions: await cacheService.getCachedSurpriseGuest()
		});
	} catch(e) {
		return next(e);
	}
};

exports.notifyAdmin = function(message) {
	const data = JSON.stringify({ content: message });
	const options = {
		hostname: "discord.com",
		port: 443,
		path: process.env.WEBHOOK,
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"Content-Length": data.length
		}
	};

	const r = https.request(options);

	r.on("error", error => {
		Sentry.captureException(error);
	});

	r.write(data);
	r.end();
};

exports.getTreeTracker = async function(req, res, next) {
	try {
		let title = "Devil's Tree Tracker";
		if (req.path === "/tree-tracker/rank-up") title += ": Rank Ups";
		return res.render("treeTracker", {
			title: title,
			description: "Obey Me Devil's Tree Tracking page that lists all devil's tree rewards, including devil points, demon vouchers, chat, icons, rank ups, and everything that you can get from the devil's tree.",
			path: req.path,
			user: req.user
		});
	} catch(e) {
		return next(e);
	}
};

exports.getTeamBuilder = async function(req, res, next) {
	return res.render("teamBuilder", {
		title: "Team Builder",
		description: "",
		user: req.user
	});
};
