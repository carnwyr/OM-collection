var mongoose = require("mongoose");

var Schema = mongoose.Schema;

var APSchema = new Schema({
  amount: { type: Number, required: function() { return this.type !== "Nightmare"; } },
  points: { type: Number, required: function() { return this.type !== "Nightmare"; } },
  page: { type: Number }
});

var RewardsSchema = new Schema({
  tag: { type: String, required: function() { return this.type !== "Nightmare"; } },
  points: { type: Number, required: function() { return this.type !== "Nightmare"; } },
  card: { type: String }
});

var EventsSchema = new Schema(
  {
    name: { type: String, required: true },
    ja_name: { type: String, required: true },
    img_name: { type: String, required: true, unique: true },
    type: { type: String, required: true, enum: ["Pop Quiz", "Lonely Devil", "Birthday", "Nightmare"] },
    start: { type: Date },
    end: { type: Date },
    ap: [APSchema],
    rewards: [RewardsSchema],
    stages: { type: Number, required: function() { return this.type !== "Nightmare"; } },
    pageCost: { type: Number, required: function() { return this.type !== "Nightmare"; } }
  }
);


module.exports = mongoose.model("events", EventsSchema);
