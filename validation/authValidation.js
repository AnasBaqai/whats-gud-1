const Joi = require('joi');
const {ROLES} = require('../utils/constants');

exports.registerUserValidation = Joi.object({
  firstName: Joi.string().required(),
  lastName: Joi.string().allow(null),
  dob: Joi.date().required(),
  email: Joi.string().email().required(),
  password: Joi.string().required(),
  location: Joi.object({
    type: Joi.string().valid('Point').default('Point'),
    coordinates: Joi.array().items(Joi.number()).required(),
  }).required(),
  image: Joi.string(),
  role: Joi.string().valid(ROLES).default(ROLES.USER),
  preferredEvents: Joi.array().items(Joi.string()), // Assuming you have a custom validation for MongoDB ObjectIds
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
