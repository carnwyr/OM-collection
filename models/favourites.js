var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var FavesCollection = new Schema(
  {
    user: {type: String, required: true},
    card: {type: String, required: true}
  }
);

module.exports = mongoose.model("favourites", FavesCollection);
