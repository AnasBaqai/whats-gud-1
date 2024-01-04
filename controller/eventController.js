const {
  createEvent,
  findEvent,
  getAllEvents,
  findManyEvents,
} = require("../models/eventModel");
const {
  parseBody,
  generateResponse,
  getReverseGeocodingData,
} = require("../utils");
const { STATUS_CODES } = require("../utils/constants");
const { s3Uploadv3 } = require("../utils/s3Upload");
const { eventValidation } = require("../validation/eventValidation");
const mongoose = require("mongoose");
const { getAllEventsQuery } = require("./queries/eventQueries");
const { findUser } = require("../models/userModel");
const { locationValidation } = require("../validation/userValidation");

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
    const page = parseInt(req.query.page) || 1; // Default to page 1 if not provided
    const limit = parseInt(req.query.limit) || 10; // Default to a limit if not provided
    const userId = mongoose.Types.ObjectId(req.user.id);
    const user = await findUser({ _id: userId });
    let {subCategoryIds} = req.body || [];
    //convert subCategoryIds to objectIds
    subCategoryIds = subCategoryIds.map((id) => mongoose.Types.ObjectId(id));
    console.log(subCategoryIds);

    let pipeline;
    if (req.query.mainCategoryId) {
      const mainCategoryId = mongoose.Types.ObjectId(req.query.mainCategoryId);
      pipeline = getAllEventsQuery(mainCategoryId, userId); // For specific category
    } else {
      pipeline = getAllEventsQuery(null,subCategoryIds, userId); // For all events
    }

    pipeline.unshift({
      $geoNear: {
        near: { type: "Point", coordinates: user.location.coordinates },
        distanceField: "dist.calculated",
        maxDistance: 7000, // 7 km in meters
        spherical: true,
      },
    });

    const result = await getAllEvents({
      query: pipeline,
      page,
      limit,
      responseKey: "events",
    });

    return generateResponse(
        result ,
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

// get event by id
exports.getEventByIdController = async (req, res, next) => {
  try {
    const eventId = mongoose.Types.ObjectId(req.params.eventId);
    const userId = mongoose.Types.ObjectId(req.user.id);
    const pipeline = getAllEventsQuery(eventId,[], userId);
    const result = await getAllEvents({
      query: pipeline,
      page: 1,
      limit: 1,
      responseKey: "event",
    });

    return generateResponse(result, "Event fetched successfully", res);
  } catch (error) {
    console.log(error.message);
    return next({
      statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR,
      message: "internal server error",
    });
  }
};

exports.giveEventCount = async (req, res, next) => {
  try {
    const body = parseBody(req.body);
    const { location } = body;
    const { error } = locationValidation.validate(body);
    if (error)
      return next({
        statusCode: STATUS_CODES.BAD_REQUEST,
        message: error.message,
      });
    const longitude = location.coordinates[0];
    const latitude = location.coordinates[1];
    const result = await getReverseGeocodingData(latitude, longitude);
    // get events count in 7km radius
    const eventsCount = await findManyEvents([
      {
        $geoNear: {
          near: { type: "Point", coordinates: [longitude, latitude] },
          distanceField: "dist.calculated",
          maxDistance: 7000, // 7 km in meters
          spherical: true,
        },
      },
      {
        $count: "numberOfEvents",
      },
    ]);
    return generateResponse(
      {
        eventNumber: eventsCount[0] ? eventsCount[0].numberOfEvents : 0,
        result,
      },
      "Events count fetched successfully",
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

// function to fav the event
exports.favEventController = async (req, res, next) => {
  try {
    const eventId = mongoose.Types.ObjectId(req.params.eventId);
    const userId = mongoose.Types.ObjectId(req.user.id);
    const event = await findEvent({ _id: eventId });
    if (!event) {
      return next({
        statusCode: STATUS_CODES.NOT_FOUND,
        message: "Event not found",
      });
    }

    const isFav = event.favorites.includes(userId);
    if (isFav) {
      event.favorites.pull(userId);
    } else {
      event.favorites.push(userId);
    }
    await event.save();
    return generateResponse(
      { isFav: !isFav },
      "Event updated successfully",
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
