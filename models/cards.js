var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var CardsSchema = new Schema(
  {
    name: {type: String, required: true},
    ja_name: { type: String },
    uniqueName: {type: String, required: true, unique: true},
    type: {type: String, required: true, enum: ['Demon', 'Memory']},
    rarity: {type: String, required: true, enum: ['N', 'R', 'SR', 'SSR', 'UR', 'UR+']},
    attribute: {type: String, required: true, enum: ['Pride', 'Greed', 'Envy', 'Wrath', 'Lust', 'Gluttony', 'Sloth']},
    characters: {type: Array},
    number: {type: Number, required: true}
  }
);

module.exports = mongoose.model('cards', CardsSchema);
