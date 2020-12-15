var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var UsersSchema = new Schema(
  {
    name: {type: String, required: true, unique: true},
    password: {type: String, required: true, unique: true},
    isAdmin: {type: Boolean, required: true},
    email: {type: String},
    supportStatus: {type: Array}
  }
);

module.exports = mongoose.model('users', UsersSchema);
