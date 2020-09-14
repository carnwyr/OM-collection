var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var CardsCollectionSchema = new Schema(
  {
    user: {type: String, required: true},
    card: {type: String, required: true}
  },
  {
  	collection: 'cardsCollection'
  }
);

module.exports = mongoose.model('cardsCollection', CardsCollectionSchema);