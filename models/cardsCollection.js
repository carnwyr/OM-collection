var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var CardsCollectionSchema = new Schema(
  {
    user: {type: Schema.Types.ObjectId, required: true, ref: 'users'},
    card: {type: Schema.Types.ObjectId, required: true, ref: 'cards'}
  },
  {
  	collection: 'cardsCollection'
  }
);

//Export model
module.exports = mongoose.model('cardsCollection', CardsCollectionSchema);