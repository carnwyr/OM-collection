var mongoose = require("mongoose");

const suggestionSchema = new mongoose.Schema({
	user: { type: String, required: true },
	page: { type: String, required: true },
	stringifiedJSON: { type: String, required: true },
	status: { type: String, required: true, enum: ["pending", "approved", "refused"]}
});

module.exports = mongoose.model("Suggestion", suggestionSchema);
