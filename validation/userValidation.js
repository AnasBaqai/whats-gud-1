const Joi = require('joi');

exports.resetPasswordValidation = Joi.object({
    password: Joi.string().min(8).max(30).required(),
    confirmPassword: Joi.string().valid(Joi.ref('password')).required(),
});

exports.changePasswordValidation = Joi.object({
    oldPassword: Joi.string().min(8).max(30).required(),
    newPassword: Joi.string().min(8).max(30).required(),
    confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required(),
});

exports.updateProfileValidation = Joi.object({
    // alphabets followed by numbers
    firstName: Joi.string().regex(/^[a-zA-Z]+[0-9]*$/).min(3).max(30).required(),
    lastName: Joi.string().regex(/^[a-zA-Z]+[0-9]*$/).min(3).max(30).allow(null, ''),
    dob: Joi.string().regex(/^(?:\d{2}|\d{4})-(?:\d{1,2})-(?:\d{1,2})$/).required(),
    preferredEvents: Joi.array().items(Joi.string()),
    location: Joi.object({
        type: Joi.string().valid('Point').default('Point'),
        coordinates: Joi.array().items(Joi.number()).required(),
      }).required(),
      image: Joi.string().allow(null),
});
