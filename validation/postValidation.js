const Joi = require('joi');
const mongoose = require('mongoose');
const objectId = (value, helpers) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return helpers.message(`"${value}" is not a valid Object ID`);
  }
  return value;
};

exports.postValidation = Joi.object({
  content: Joi.string().required(),
  media: Joi.array().items(Joi.string()), // Array of media URLs
  postedBy: Joi.custom(objectId, 'Object ID validation').required(),
});


exports.commentValidation = Joi.object({
  content: Joi.string().required(),
  media: Joi.array().items(Joi.string()), 
});

exports.replyValidation = Joi.object({
  content: Joi.string().required(),
  media: Joi.array().items(Joi.string()), 
});


