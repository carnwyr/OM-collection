var mongoose = require("mongoose");

const hiddenCardSchema = new mongoose.Schema({
	name: { type: String, required: true, unique: true },
	uniqueName: { type: String, required: true, unique: true },
	ja_name: { type: String, required: true },
	source: { type: Array, required: true },
	ja_source: { type: Array, required: true },  // TODO: remove
	type: { type: String, required: true, enum: ["Demon", "Memory"] },
	rarity: { type: String, required: true, enum: ["N", "R", "SR", "SSR", "UR", "UR+"] },
	attribute: { type: String, required: true, enum: ["Pride", "Greed", "Envy", "Wrath", "Lust", "Gluttony", "Sloth"] },
	characters: { type: Array, required: true },
	number: { type: Number, required: true }
}, { collection: "hiddenCards" });

module.exports = mongoose.model("HiddenCard", hiddenCardSchema);
