"use strict";
const { STATUS_CODES } = require("../utils/constants");
const { parseBody, generateResponse } = require("../utils");
const { updateUser, findUser } = require("../models/userModel");
const { updateProfileValidation } = require("../validation/userValidation");
const { findManyEventsByIds } = require("../models/eventTypeModel");
const mongoose = require("mongoose");
const { deleteFileFromS3 } = require("../utils/imageUpload");
// Function to update user profile
exports.createProfile = async (req, res, next) => {
  try {
    const body = parseBody(req.body);
    const { preferredEvents, firstName, lastName, dob, location, gender } =
      body;
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
    const user = req.user;
    const eventsIds = await findManyEventsByIds(preferredEvents);
    const updatedUser = await updateUser(
      { _id: mongoose.Types.ObjectId(user.id) },
      { preferredEvents: eventsIds, firstName, lastName, dob, location, gender }
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

  // Assuming 'updateUserProfilePhoto' is a function that updates the user's photo
  const filePath = req.file.location; // The file location on S3
  const userId = req.user.id;
  const user = await findUser({ _id: userId });
  if (user.image) {
    await deleteFileFromS3(user.image);
  }
  await updateUser({ _id: userId }, { image: filePath });
  return generateResponse({ filePath }, "Profile image uploaded", res);
};
