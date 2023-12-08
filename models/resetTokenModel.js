const {Schema,model} = require('mongoose');

const passwordResetSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  token: {
    type: String,
    required: true
  },
  expires: {
    type: Date,
    required: true
  },
  isVerified: {
    type: Boolean,
    default: false
  }

});

const PasswordReset = model('PasswordReset', passwordResetSchema);

// create new password reset token
exports.createPasswordResetToken = (obj) => PasswordReset.create(obj);

// find password reset token
exports.findPasswordResetToken = (query) => PasswordReset.findOne(query);

// delete password reset token
exports.deletePasswordResetToken = (query) => PasswordReset.findOneAndDelete(query);
