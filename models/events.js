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
	card: { type: String, required: true },
	points: { type: String }
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

// var APSchema = new Schema({
// 	amount: { type: Number, required: true },
// 	points: { type: Number, required: true },
// 	page: { type: Number }
// });

const lockedStageSchema = new Schema({
	name: String,
	req: Number
}, { _id: false });

const stageSchema = new Schema({
	name: String,
	rewards: Array
}, { _id: false });

const popQuizSchema = new Schema({
	rewardListType: { type: String, required: true, enum: ["points", "boxes"] },
	hasKeys:{ type: Boolean, required: true },
	isLonelyDevil: { type: Boolean, required: true },
	isBirthday: { type: Boolean, required: true },
	hasBoosting: { type: Boolean, required: true },

	listRewards: { type: [rewardSchema] },
	boxRewards: { type: [boxSetSchema] },

	stages: { type: Number, required: true },
	stageList: { type: [stageSchema] },
	lockedStages: { type: [lockedStageSchema] },

	boostingStart: { type: Date },
	boostingEnd: { type: Date },

	// pageCost: { type: Number },
	// ap: { type: [APSchema] }
});

const PopQuiz = Event.discriminator("PopQuiz", popQuizSchema);
const Nightmare = Event.discriminator("Nightmare", new mongoose.Schema({}));
const ChargeMission = Event.discriminator("ChargeMission", new mongoose.Schema({}));
const LoginBonus = Event.discriminator("LoginBonus", new mongoose.Schema({}));
const Other = Event.discriminator("Other", new mongoose.Schema({}));


module.exports = Event;
// exports.APSchema = APSchema;
