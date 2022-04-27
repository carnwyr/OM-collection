const cacheService = require("../services/cacheService");
const https = require("https");

exports.privacyPolicy = function(req, res, next) {
	return res.render("policies", { title: "Privacy Policy", user: req.user });
};

exports.surpriseGuest = async function(req, res, next) {
	try {
		return res.render("surpriseGuest", {
			title: req.i18n.t("common.spg"),
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
