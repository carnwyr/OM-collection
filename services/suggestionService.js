const Sentry = require("@sentry/node");

const Suggestions = require("../models/suggestions.js");

exports.getSuggestion = async function(query = {}) {
  try {
    return await Suggestions.findOne(query);
  } catch(e) {
		console.error(e);
    Sentry.captureException(e);
		return [];
	}
};

exports.getSuggestionList = async function(query = {}) {
  try {
    return await Suggestions.find(query);
  } catch(e) {
		console.error(e);
    Sentry.captureException(e);
		return [];
	}
};

exports.addSuggestion = async function(data) {
  try {
    data.status = "pending";
    return await Suggestions.create(data);
  } catch(e) {
    return { err: true, message: e.message };
  }
};

exports.updateSuggestionStatus = async function(id, status) {
  try {
    let res = await Suggestions.updateOne(
      { _id: id },
      { $set: { status: status } }
    );
    if (res.err) throw res.message;
    return { err: null, message: "Suggestion status updated!" };
  } catch(e) {
    return { err: true, message: e.message };
  }
};

exports.refuseSuggestionsFrom = async function(query) {
  try {
    return await Suggestions.updateMany(query, { $set: { status: "refused" }});
  } catch(e) {
    return { err: true, message: e.message };
  }
};
