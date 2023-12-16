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
const { findUser } = require("../models/userModel");

exports.createEventController = async (req, res, next) => {
  try {
    const body = parseBody(req.body);
    
    // if (req.file) {
    //   coverImages = await s3Uploadv3([req.file]);
    // }

    const newEvent = {
      ...body,
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
    const userId =  mongoose.Types.ObjectId(req.user.id);
    const user = await findUser({ _id: userId });

    const mainCategoryId = mongoose.Types.ObjectId(req.query.mainCategoryId);
    const pipeline = getAllEventsQuery(mainCategoryId);
    pipeline.unshift({
      $geoNear: {
        near: { type: "Point", coordinates: user.location.coordinates },
        distanceField: "dist.calculated",
        maxDistance: 7000, // 7 km in meters
        spherical: true
      }
    });
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


/*
const NodeGeocoder = require('node-geocoder');

// Set up the geocoder
const options = {
  provider: 'google',
  // Optional depending on the providers
  httpAdapter: 'https', 
  apiKey: 'YOUR_API_KEY', // Replace with your Google Maps API key
  formatter: null
};

const geocoder = NodeGeocoder(options);

exports.createEventController = async (req, res, next) => {
  try {
    const body = parseBody(req.body);

    // Geocode the address to get coordinates
    if (!body.address) {
      return next({
        statusCode: STATUS_CODES.BAD_REQUEST,
        message: "Address is required",
      });
    }

    const geocodeResult = await geocoder.geocode(body.address);
    if (geocodeResult.length === 0) {
      return next({
        statusCode: STATUS_CODES.BAD_REQUEST,
        message: "Geocoding failed or address is invalid",
      });
    }

    const newEvent = {
      ...body,
      creator: req.user.id,
      location: {
        type: 'Point',
        coordinates: [geocodeResult[0].longitude, geocodeResult[0].latitude]
      }
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
      message: "Internal server error",
    });
  }
};
*/