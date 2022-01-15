var mongoose = require("mongoose");

var Schema = mongoose.Schema;

const options = { discriminatorKey: "type" };

const eventSchema = new Schema({
	name: {
		en: { type: String, required: true, unique: true },
		ja: { type: String, default: "???" },
		zh: { type: String, default: "???" }
	},
	start: { type: Date },
	end: { type: Date },
	type: { type: String, required: true, enum: ["PopQuiz", "Nightmare", "ChargeMission", "LoginBonus", "Other"] }
}, options);

const Event = mongoose.model("Event", eventSchema);

const rewardSchema = new Schema({
	name: { type: String, required: true },
	cost: { type: String },
	tag: { type: String }
});

const boxSchema = new Schema({
	name: String,
	itemsCount: Number,
	ultimateReward: String
});

const boxSetSchema = new Schema({
	name: { type: String, required: true },
	cost: Number,
	boxes: [boxSchema]
});

var APSchema = new Schema({
	amount: { type: Number, required: true },
	points: { type: Number, required: true },
	page: { type: Number }
});

const popQuizSchema = new Schema({
	isLonelyDevil: Boolean,
	isBirthday: Boolean,
	rewardListType: { type: String, required: true, enum: ["points", "boxes"] },
	stages: { type: Number, required: true },
	// keys: { type: Number },
	boxRewards: { type: [boxSetSchema] },
	listRewards: { type: [rewardSchema] },
	ap: { type: [APSchema] },
	pageCost: { type: Number }
});

const PopQuiz = Event.discriminator("PopQuiz", popQuizSchema);


module.exports = Event;
exports.APSchema = APSchema;
