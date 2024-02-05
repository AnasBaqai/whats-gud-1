const Joi = require('joi');

exports.streamValidationSchema = Joi.object({
  userId: Joi.string().required(),
  category: Joi.string(),
  streamName: Joi.string(),
  streamDescription: Joi.string(),
  streamAddress: Joi.string(),
  location: Joi.object({
    type: Joi.string().valid('Point').default('Point'),
    coordinates: Joi.array().items(Joi.number()).default([0, 0]),
  }).default({
    type: 'Point',
    coordinates: [0, 0],
  }),
})

