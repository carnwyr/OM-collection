var mongoose = require('mongoose');

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

var LockedSchema = new Schema({
    keysNeeded: { type: Number, required: function() { return this.type !== "Nightmare"; } },
    availableKeyStages: { type: Number, required: function() { return this.type !== "Nightmare"; } }
});

var EventsSchema = new Schema(
  {
    name: { type: String, required: function() { return this.type !== "Nightmare"; } },
    ja_name: { type: String, required: function() { return this.type !== "Nightmare"; } },
    img_name: { type: String, required: function() { return this.type !== "Nightmare"; } },
    type: { type: String, required: function() { return this.type !== "Nightmare"; }, enum: ['Pop Quiz', 'Lonely Devil', 'Birthday', "Nightmare"] },
    start: { type: Date},
    end: { type: Date },
    ap: [APSchema],
    rewards: [RewardsSchema],
    stages: { type: Number, required: function() { return this.type !== "Nightmare"; } },
    pageCost: { type: Number, required: function() { return this.type !== "Nightmare"; } },
    lockedStages: [LockedSchema]
  }
);

module.exports = mongoose.model('events', EventsSchema);
