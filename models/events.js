var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var RewardsSchema = new Schema({
    type: { type: String, required: true },
    points: { type: Number, required: true },
    card: { type: String }
});

var APSchema = new Schema({
    amount: { type: Number, required: true },
    points: { type: Number, required: true },
    repeat: { type: Boolean }
});

var EventsSchema = new Schema(
  {
    name: { type: String, required: true },
    ja_name: { type: String, required: true },
    type: { type: String, required: true, enum: ['Pop Quiz', 'Nightmare'] },
    cards: [String],
    costs: [RewardsSchema],
    ap: [APSchema],
    status: { type: String, enum: ['Unavailable', 'Running', 'Returned'] },
    end_date: { type: Date }
  }
);

module.exports = mongoose.model('events', EventsSchema);
