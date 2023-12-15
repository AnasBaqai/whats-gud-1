const {
  createEvent,
  findEvent,
  getAllEvents,
} = require("../models/eventModel");
const { parseBody, generateResponse } = require("../utils");
const { STATUS_CODES } = require("../utils/constants");
const { s3Uploadv3 } = require("../utils/s3Upload");
const { eventValidation } = require("../validation/eventValidation");
const mongoose = require("mongoose");
const { getAllEventsQuery } = require("./queries/eventQueries");

exports.createEventController = async (req, res, next) => {
  try {
    const body = req.body;
    let coverImages = [" "];
    if (req.file) {
      coverImages = await s3Uploadv3([req.file]);
    }
   
    const newEvent = {
      ...body,
      coverImage: coverImages[0],
      creator: req.user.id,
    };
    const { error } = eventValidation.validate(newEvent);
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
};

exports.getAllEventsController = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page);
    const limit = parseInt(req.query.limit);
    const mainCategoryId = mongoose.Types.ObjectId(req.query.mainCategoryId);
    const pipeline = getAllEventsQuery(mainCategoryId);
    const result = await getAllEvents({
      query: pipeline,
      page,
      limit,
      responseKey: "events",
    });
    return generateResponse(
      { eventType: result },
      "Events fetched successfully",
      res
    );
  } catch (error) {
    console.log(error.message);
    return next({
      statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR,
      message: "internal server error",
    });
  }
};
