const suggestionService = require("../services/suggestionService");
const cardService = require("../services/cardService");
const eventService = require("../services/eventService");
const Sentry = require("@sentry/node");

exports.getSuggestionPage = async function(req, res, next) {
	try {
		var suggestion = await suggestionService.getSuggestion({ _id: req.params.id });
		var originalFile = await getOriginalFile(suggestion.page.split("/"));
		return res.render("suggestionDetail", {
			title: req.params.id ,
			originalFile: originalFile,
			suggestion: suggestion,
			user: req.user
		});
	} catch(e) {
		return next(e);
	}
};

async function getOriginalFile(path) {
	try {
		let db = path[path.length - 2];
		if (db === "card") {
			return await cardService.getCard({ uniqueName: path[path.length - 1] });;
		} else if (db === "event") {
			return await eventService.getEvent({ "name.en": path[path.length - 1].replace(/_/g, " ") });
		} else {
			return { error: "Something went wrong." };
		}
	} catch(e) {
		return { error: e.message };
	}
}

exports.getSuggestionList = async function(req, res, next) {
	try {
		var suggestions = await suggestionService.getSuggestionList({ status: "pending" });
		return res.render("suggestionList", { title: "Suggestions", suggestions: suggestions, user: req.user });
	} catch(e) {
		return next(e);
	}
};

exports.addSuggestion = async function(req, res) {
	notifyAdmin(`New suggestion from __${req.user.name}__ on __${req.body.page}__.`);
	return res.json(await suggestionService.addSuggestion({
		user: req.user.name,
		page: req.body.page,
		stringifiedJSON: req.body.data
	}));
};

// NOTE: card search use uniqueName, event search use name.en
exports.approveSuggestion = async function(req, res) {
	try {
		let suggestion = await suggestionService.getSuggestion({ _id: req.body._id });
		let db = suggestion.page.split("/")[1];
		let docName = suggestion.page.split("/")[2];
		let data = JSON.parse(req.body.data);

		if (db === "card") {
			let result = await cardService.updateCard({
				originalUniqueName: docName,
				cardData: data
			});
			if (result.err) throw result.message;
		} else if (db === "event") {
			let result = await eventService.updateEvent(docName.replace(/_/g, " "), data);
			if (result.err) throw result.message;
		} else {
			return res.json({ err: true, message: "Invalid suggestion path." });
		}
		return res.json(await suggestionService.updateSuggestionStatus(req.body._id, "approved"));
	} catch(e) {
		return res.json({ err: true, message: e.message });
	}
};

exports.refuseSuggestion = async function(req, res) {
	return res.json(await suggestionService.updateSuggestionStatus(req.body._id, "refused"));
};

function notifyAdmin(message) {
	const https = require("https");
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
}
