var mongoose = require("mongoose");

const Schema = mongoose.Schema;

const strengthSchema = new Schema({
	min: Number,
	max: Number,
	fdt: Number
});

const cardSchema = new mongoose.Schema({
	name: { type: String, required: true, unique: true },
	uniqueName: { type: String, required: true, unique: true },
	ja_name: { type: String, required: true },
	source: { type: Array, required: true },
	type: { type: String, required: true, enum: ["Demon", "Memory"] },
	rarity: { type: String, required: true, enum: ["N", "R", "SR", "SSR", "UR", "UR+"] },
	attribute: { type: String, required: true, enum: ["Pride", "Greed", "Envy", "Wrath", "Lust", "Gluttony", "Sloth"] },
	characters: { type: Array, required: true },
	strength: {
		pride: strengthSchema,
		greed: strengthSchema,
		envy: strengthSchema,
		wrath: strengthSchema,
		lust: strengthSchema,
		gluttony: strengthSchema,
		sloth: strengthSchema
	},
	number: { type: Number, required: true }
});

module.exports = mongoose.model("Card", cardSchema);
