var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var UsersSchema = new Schema(
  {
    info: {
      name: {type: String, required: true, unique: true},
      password: {type: String, required: true, unique: true},
      type: {type: String, required: true, enum: ['Admin', 'User']},
      email: {type: String},
      supportStatus: {type: Array}
    },
    cards: {
      owned: {type: Array},
      faved: {type: Array}
    }
  }
);

module.exports = mongoose.model('users', UsersSchema);
