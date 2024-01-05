const Joi = require("joi");

module.exports.chatValidation = Joi.object({
  userId: Joi.string().required(),
  chatId: Joi.string().required(),
  messageBody: Joi.string(),
  mediaUrls: Joi.array(),
  mediaType: Joi.string(),
  name: Joi.string(),
});
