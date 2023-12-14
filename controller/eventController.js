const {createEvent,findEvent} = require('../models/eventModel');
const { parseBody, generateResponse } = require('../utils');
const { STATUS_CODES } = require('../utils/constants');
const { s3Uploadv3 } = require('../utils/s3Upload');
const { eventValidation } = require('../validation/eventValidation');

exports.createEventController = async (req,res,next) => {
  try {
    const body = req.body;
    let coverImages = [' '];
    console.log(coverImages)
    if (req.file) {
      coverImages = await s3Uploadv3([req.file]);
    }
    console.log(coverImages)
    const newEvent= {
      ...body,
      coverImage:coverImages[0],
      creator:req.user.id
    }
    const {error} = eventValidation.validate(newEvent);
    if (error) {
      return next({
        statusCode: STATUS_CODES.BAD_REQUEST,
        message: error.details[0].message,
      });
    }
    const event = await createEvent(newEvent);
    return generateResponse(event, "Event created successfully", res);
  } catch (error) {
    console.log(error.message);
    return next({
      statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR,
      message: "internal server error",
    });
  }
}