var mongoose = require('mongoose');

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

var LockedSchema = new Schema({
    keysNeeded: { type: Number, required: true },
    availableKeyStages: { type: Number, required: true }
});

var EventsSchema = new Schema(
  {
    name: { type: String, required: true },
    ja_name: { type: String, required: true },
    img_name: { type: String, required: true },
    type: { type: String, required: true, enum: ['Pop Quiz', 'Lonely Devil', 'Birthday'] },
    start: { type: Date},
    end: { type: Date },
    ap: [APSchema],
    rewards: [RewardsSchema],
    stages: { type: Number, required: true },
    pageCost: { type: Number, required: true },
    lockedStages: [LockedSchema]
  }
);

module.exports = mongoose.model('events', EventsSchema);
