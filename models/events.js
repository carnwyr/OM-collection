var mongoose = require("mongoose");

var Schema = mongoose.Schema;

var APSchema = new Schema({
	amount: { type: Number, required: true },
	points: { type: Number, required: true },
	page: { type: Number }
});

var RewardsSchema = new Schema({
	tag: { type: String, required: true },
	points: { type: Number, required: true },
	card: { type: String }
});

var EventsSchema = new Schema(
	{
		name: { type: String, required: true },
		ja_name: { type: String, required: true },
		uniqueName: { type: String, required: true, unique: true },
		type: { type: String, required: true, enum: ["Pop Quiz", "Lonely Devil", "Birthday", "Nightmare"] },
		start: { type: Date },
		end: { type: Date },
		ap: { type: [APSchema], required: function() { return this.type !== "Nightmare"; } },
		rewards: { type: [RewardsSchema], required: function() { return this.type !== "Nightmare"; } },
		stages: { type: Number, required: function() { return this.type !== "Nightmare"; } },
		pageCost: { type: Number, required: function() { return this.type !== "Nightmare"; } }
	}
);


module.exports = mongoose.model("events", EventsSchema);
