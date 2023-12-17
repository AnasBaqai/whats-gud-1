const Joi = require('joi');
const mongoose = require('mongoose');
const objectId = (value, helpers) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return helpers.message(`"${value}" is not a valid Object ID`);
  }
  return value;
};
exports.eventTypeValidation = Joi.object({
  name: Joi.string().required(),
});
exports.subEventTypeValidation = Joi.object({
  eventType: Joi.custom(objectId, 'Object ID validation').required(),
  name: Joi.string().required(),
});
exports.eventValidation = Joi.object({
  category: Joi.object({
    main: Joi.string().required(),
    sub: Joi.array().items(Joi.string()).required()
  }).required(),
  eventName: Joi.string().required(),
  artistDJ: Joi.object({
    id: Joi.custom(objectId, 'Object ID validation').optional(),
    name: Joi.string().optional()
  }).or('id', 'name').required().messages({
    'object.missing': 'Either artistDJ.id or artistDJ.name must be provided'
  }),
  description: Joi.string().max(1000).required(),
  dateAndTime: Joi.date().required(),
  ticketPrice: Joi.number().optional(),
  address: Joi.string().optional(),
  coverImage: Joi.string(),
  creator: Joi.custom(objectId, 'Object ID validation').required(),
  location: Joi.object({
    type: Joi.string().valid('Point').default('Point'),
    coordinates: Joi.array().items(Joi.number()).required(),
  }).required(),
  capacity: Joi.number().integer().min(1).required(),  
});


