const Interactions = require("../models/surpriseInteractions.js");
const i18next = require("i18next");

exports.privacyPolicy = function(req, res, next) {
	res.render("policies", { title: "Privacy Policy", user: req.user });
};

exports.surpriseGuest = function(req, res, next) {
	var interactions = [
		{chara:"Lucifer", interactions:[]},
		{chara:"Mammon", interactions:[]},
		{chara:"Leviathan", interactions:[]},
		{chara:"Satan", interactions:[]},
		{chara:"Asmodeus", interactions:[]},
		{chara:"Beelzebub", interactions:[]},
		{chara:"Belphegor", interactions:[]},
		{chara:"Diavolo", interactions:[]},
		{chara:"Barbatos", interactions:[]},
		{chara:"Luke", interactions:[]},
		{chara:"Simeon", interactions:[]},
		{chara:"Solomon", interactions:[]}
	];
	Interactions.find({}, function (err, interactionList) {
		if (err) { return next(err); }
		interactions.forEach(function(obj) {
			obj.interactions = interactionList.filter(int => int.character === obj.chara);
			// TODO: obj.interactions.sort((a, b) => a.order - b.order);
		});
		res.render("surpriseGuest", {
			title: i18next.t("common.spg"),
			description: "An all-in-one master guide for Obey Me surprise guest interactions, including the demon brothers and side characters.",
			user: req.user, interactions: interactions
		});

	});
};
