"use strict";
const { STATUS_CODES } = require("../utils/constants");
const { parseBody, generateResponse } = require("../utils");
const { updateUser, findUser } = require("../models/userModel");
const {
  updateProfileValidation,
  locationValidation,
} = require("../validation/userValidation");
const { findManyEventsTypeByIds } = require("../models/eventTypeModel");
const mongoose = require("mongoose");
const { s3Uploadv3, deleteImage } = require("../utils/s3Upload");
// Function to update user profile
exports.createProfile = async (req, res, next) => {
  try {
    const body = parseBody(req.body);
    const {
      preferredEvents,
      firstName,
      lastName,
      dob,
      location,
      gender,
      image,
      isComplete,
      preferredCategories,
      preferredDJ,
      prefferedStreamers,
    } = body;
    const { error } = updateProfileValidation.validate(body);

    // Validate and parse longitude and latitude
    const longitude = parseFloat(location.coordinates[0]);
    const latitude = parseFloat(location.coordinates[1]);
    // Check if parsing was successful
    if (isNaN(longitude) || isNaN(latitude)) {
      return next({
        statusCode: STATUS_CODES.BAD_REQUEST,
        message: "Invalid longitude or latitude values.",
      });
    }
    if (error)
      return next({
        statusCode: STATUS_CODES.BAD_REQUEST,
        message: error.message,
      });
    const userId = req.user.id;
    const user = await findUser({ _id: mongoose.Types.ObjectId(userId) });
    if (user.image) {
      console.log(user.image);
      console.log(await deleteImage([user.image]));
    }
    const eventsIds = await findManyEventsTypeByIds(preferredEvents);
    const updatedUser = await updateUser(
      { _id: mongoose.Types.ObjectId(userId) },
      {
        preferredEvents: eventsIds ? eventsIds : [],
        firstName,
        lastName,
        dob,
        location,
        gender,
        image,
        isComplete,
        preferredCategories: preferredCategories ? preferredCategories : [],
        preferredDJ: preferredDJ ? preferredDJ : [],
      }
    );
    return generateResponse(updatedUser, "Profile created", res);
  } catch (error) {
    console.log(error.message);
    return next({
      statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR,
      message: "internal server error",
    });
  }
};

exports.uploadProfileImage = async (req, res, next) => {
  if (!req.file) {
    return next({
      statusCode: STATUS_CODES.BAD_REQUEST,
      message: "No file uploaded",
    });
  }
  // Upload the file to S3
  const filePath = await s3Uploadv3([req.file.buffer]);

  const userId = req.user.id;
  const user = await findUser({ _id: userId });
  if (user.image) {
    await deleteImage([user.image]);
  }

  await updateUser({ _id: userId }, { image: filePath[0] });

  return generateResponse(
    { fileUrl: filePath[0] },
    "Profile image uploaded",
    res
  );
};

// Function to update user location
exports.updateLocation = async (req, res, next) => {
  try {
    const body = parseBody(req.body);
    const { location } = body;
    const { error } = locationValidation.validate(body);
    const longitude = parseFloat(location.coordinates[0]);
    const latitude = parseFloat(location.coordinates[1]);
    if (isNaN(longitude) || isNaN(latitude)) {
      return next({
        statusCode: STATUS_CODES.BAD_REQUEST,
        message: "Invalid longitude or latitude values.",
      });
    }
    if (error)
      return next({
        statusCode: STATUS_CODES.BAD_REQUEST,
        message: error.message,
      });
    const userId = req.user.id;
    const updatedUser = await updateUser(
      { _id: mongoose.Types.ObjectId(userId) },
      {
        location,
      }
    );
    return generateResponse(updatedUser, "Location updated", res);
  } catch (error) {
    console.log(error.message);
    return next({
      statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR,
      message: "internal server error",
    });
  }
};
