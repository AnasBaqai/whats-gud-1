const Joi = require("joi");
const mongoose = require("mongoose");

const objectId = (value, helpers) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return helpers.message(`"${value}" is not a valid Object ID`);
  }
  return value;
};

exports.ticketValidation = Joi.object({
  _id: Joi.custom(objectId, "Object ID validation").required(), // Assuming _id is a string, adjust if it's another type
  userId: Joi.string().required(),
  eventId: Joi.custom(objectId, "Object ID validation").required(),
  quantity: Joi.number().required(),
  price: Joi.number().required(),
  barcode: Joi.string().required(),
});
