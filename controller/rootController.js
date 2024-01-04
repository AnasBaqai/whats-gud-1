"use strict";

const { generateResponse,getWeatherByCoordinates } = require("../utils");
const { STATUS_CODES } = require("../utils/constants");
exports.DefaultHandler = (req, res, next) => {
  generateResponse(null, `Welcome to the ${process.env.APP_NAME} - API`, res);
};


exports.getWeather = async (req, res, next) => {
  try {
    const {location,date} = req.body;
    const longitude = location.coordinates[0];
    const latitude = location.coordinates[1];
    const weather = await getWeatherByCoordinates(latitude, longitude,date);
    return generateResponse(weather, "Weather fetched successfully", res);
  } catch (error) {
    console.log(error.message);
    return next({
      statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR,
      message: "internal server error",
    });
  }
}
