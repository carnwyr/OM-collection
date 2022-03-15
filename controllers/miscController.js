const cacheService = require("../services/cacheService");

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

exports.calculator = function(req, res, next) {
	return res.render("temp", {
		title: "Pop Quiz Calculator",
		description: "",
		user: req.user
	});
};
