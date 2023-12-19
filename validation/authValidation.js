const Joi = require('joi');
const {ROLES} = require('../utils/constants');
const passwordPattern = new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*])(?=.{8,30})');
exports.registerUserValidation = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().pattern(passwordPattern).min(8).max(30).required(),
  role: Joi.string().valid(ROLES).default(ROLES.USER),// Assuming you have a custom validation for MongoDB ObjectIds
  isActive: Joi.boolean().default(true),
  fcmToken: Joi.string(),
  refreshToken: Joi.string(),
}).options({ abortEarly: false });



exports.loginUserValidation = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).max(30).required(),
    fcmToken: Joi.string(),
});

exports.refreshTokenValidation = Joi.object({
    refreshToken: Joi.string().required(),
})
