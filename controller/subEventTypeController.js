// Import necessary modules
const { default: mongoose } = require("mongoose");
const { createSubEventType,getAllSubEventstype } = require("../models/subEventTypemodel");
const { parseBody, generateResponse } = require("../utils");
const { STATUS_CODES } = require("../utils/constants");
const { subEventTypeValidation } = require("../validation/eventValidation");
// Function to create a new event
exports.createSubEventTypeController = async (req, res, next) => {
  // Create a new event object
  try {
    const body = parseBody(req.body);
    const { eventType,name } = body;

    const subEventData = {
      eventType,
      name,
    };
    const {error} = subEventTypeValidation.validate(subEventData);
    if (error) {
      return next({
        statusCode: STATUS_CODES.BAD_REQUEST,
        message: error.details[0].message,
      });
    }
    const subEvent = await createSubEventType(subEventData);
    return generateResponse(subEvent, "Sub Event type created successfully", res);
  } catch (error) {
    console.log(error.message);
    return next({
      statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR,
      message: "internal server error",
    });
  }
};

exports.getAllSubEventsController = async (req, res,next) => {
  try {
    const page = parseInt(req.query.page);
    const limit = parseInt(req.query.limit);
    const eventType = req.query.eventType;

    const pipeline = [{ $match: {eventType:mongoose.Types.ObjectId(eventType)} }];
    const result = await getAllSubEventstype({ query: pipeline, page, limit,responseKey:'subEventsType' });
    return generateResponse(result, "Sub Events fetched successfully", res);
  } catch (error) {
    console.log(error.message)
    return next({
      statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR,
      message: "internal server error",
    });
  }
};
