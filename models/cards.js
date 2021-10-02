var mongoose = require("mongoose");

var Schema = mongoose.Schema;

var CardsSchema = new Schema(
	{
		name: { type: String, required: true },
		uniqueName: { type: String, required: true, unique: true },
		ja_name: { type: String, required: true },
		// zh_name: { type: String },
		source: { type: Array, required: true },
		ja_source: { type: Array, required: true },
		// zh_source: { type: Array },
		type: { type: String, required: true, enum: ["Demon", "Memory"] },
		rarity: { type: String, required: true, enum: ["N", "R", "SR", "SSR", "UR", "UR+"] },
		attribute: { type: String, required: true, enum: ["Pride", "Greed", "Envy", "Wrath", "Lust", "Gluttony", "Sloth"] },
		characters: { type: Array, required: true },
		number: { type: Number, required: true }
	}
);

module.exports = mongoose.model("cards", CardsSchema);
