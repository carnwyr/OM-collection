var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var CodesSchema = new Schema(
  {
    user: {type: String, required: true},
    email: {type: String, required: true},
    code: {type: String, required: true}
  }
);

module.exports = mongoose.model('verificationCodes', CodesSchema, 'verificationCodes');