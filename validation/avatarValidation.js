const Joi = require("joi");

module.exports.avatarValidation = Joi.object({
  name: Joi.string().required(),
  url: Joi.string().required(),
  mime: Joi.string().required(),
  desc: Joi.string().required(),
});