"use strict";

const { generateResponse, getWeatherByCoordinates } = require("../utils");
const { STATUS_CODES } = require("../utils/constants");
const { queryChatGPT } = require("../utils");
const { findManyUsers } = require("../models/userModel");
const { searchUsersQuery } = require("./queries/userQueries");
const { searchEventsQuery } = require("./queries/eventQueries");
const { findManyEvents } = require("../models/eventModel");
const mongoose = require("mongoose");
exports.DefaultHandler = (req, res, next) => {
  generateResponse(null, `Welcome to the ${process.env.APP_NAME} - API`, res);
};

exports.getWeather = async (req, res, next) => {
  try {
    const { location, date } = req.body;
    const longitude = location.coordinates[0];
    const latitude = location.coordinates[1];
    const weather = await getWeatherByCoordinates(latitude, longitude, date);
    return generateResponse(weather, "Weather fetched successfully", res);
  } catch (error) {
    console.log(error.message);
    return next({
      statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR,
      message: "internal server error",
    });
  }
};

exports.chatbot = async (req, res, next) => {
  try {
    const { message } = req.body;
    const response = await queryChatGPT(message);
    return generateResponse(response, "Response fetched successfully", res);
  } catch (error) {
    console.log(error.message);
    return next({
      statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR,
      message: "internal server error",
    });
  }
};

// search user and events by name from the database
exports.search = async (req, res, next) => {
  try {
   
    if(req.query.search === ''){
      return generateResponse({users:[],events:[]}, "Response fetched successfully", res);
    }
    if(req.query.type==='user'){
      const usersQuery = searchUsersQuery(req.query.search);
      const users = await findManyUsers(usersQuery);
      return generateResponse({users}, "Response fetched successfully", res);
    }
    const userId= mongoose.Types.ObjectId(req.user.id);
    const search = req.query.search;
    const usersQuery = searchUsersQuery(search);
    const users = await findManyUsers(usersQuery);
    const eventsQuery = searchEventsQuery(search,userId);
    const events = await findManyEvents(eventsQuery);
    const response = {
      users,
      events,
    };
    // shuffle the response

    return generateResponse(response, "Response fetched successfully", res);
  } catch (error) {
    console.log(error.message);
    return next({
      statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR,
      message: "internal server error",
    });
  }
};
