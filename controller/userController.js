"use strict";
const { STATUS_CODES } = require("../utils/constants");
const { parseBody, generateResponse } = require("../utils");
const { updateUser, findUser, findUsers } = require("../models/userModel");
const {
  updateProfileValidation,
  locationValidation,
  profileValidation,
} = require("../validation/userValidation");
const { findManyEventsTypeByIds } = require("../models/eventTypeModel");
const mongoose = require("mongoose");
const { s3Uploadv3, deleteImage } = require("../utils/s3Upload");
// Function to update user profile
exports.createProfile = async (req, res, next) => {
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
    address,
  } = body;
  const { error } = updateProfileValidation.validate(body);
  if (error) {
    return next({
      statusCode: STATUS_CODES.BAD_REQUEST,
      message: error.message,
    });
  }

  // Validate and parse longitude and latitude
  let longitude = 0;
  let latitude = 0;
  if (location) {
    [longitude, latitude] = location?.coordinates?.map((coord) =>
      parseFloat(coord)
    );
  }
  try {
    const userId = mongoose.Types.ObjectId(req.user.id);
    const user = await findUser({ _id: userId }).exec();
    if (!(user.image === image)) {
      if (user && user.image) {
        await deleteImage([user.image]); // Assuming deleteImage is an async function
      }
    }

    const updateData = {
      preferredEvents: preferredEvents || [],
      firstName,
      lastName,
      dob,
      location: { type: "Point", coordinates: [longitude, latitude] },
      gender,
      image,
      isComplete,
      preferredCategories: preferredCategories || [],
      preferredDJ: preferredDJ || [],
      prefferedStreamers: prefferedStreamers || [],
      address: address || { city: null, state: null, country: null },
    };

    const updatedUser = await updateUser({ _id: userId }, updateData).exec();
    return generateResponse(updatedUser, "Profile created", res);
  } catch (error) {
    console.error(error); // Consider more selective logging in production
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
  // if (user.image) {
  //   await deleteImage([user.image]);
  // }

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

exports.getUserProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const user = await findUser({ _id: mongoose.Types.ObjectId(userId) });
    if (!user) {
      return next({
        statusCode: STATUS_CODES.NOT_FOUND,
        message: "User not found",
      });
    }
    return generateResponse(user, "User profile fetched", res);
  } catch (error) {
    console.log(error.message);
    return next({
      statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR,
      message: "internal server error",
    });
  }
};

// return new access token
exports.createAccessToken = async (req, res, next) => {
  try {
    const user = req.user;
    console.log(user);
    const token = generateToken(user);
    res.setHeader("authorization", token);
    return generateResponse(token, "Access token created", res);
  } catch (err) {
    return next({
      statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR,
      message: "internal server error",
    });
  }
};

// search users in firstname and lastname through query params and get only image firstName lastName email and id

exports.searchUsers = async (req, res, next) => {
  try {
    const { search } = req.query;
    const users = await findUsers({
      $or: [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ],
    }).select("firstName lastName email image _id");
    return generateResponse(users, "Users fetched", res);
  } catch (err) {
    return next({
      statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR,
      message: "internal server error",
    });
  }
};

// set user avatar

exports.setUserAvatar = async (req, res, next) => {
  try {
    const { avatar } = req.body;
    const userId = req.user.id;
    const updatedUser = await updateUser(
      { _id: mongoose.Types.ObjectId(userId) },
      {
        avatar,
      }
    );
    return generateResponse(updatedUser, "User avatar updated", res);
  } catch (err) {
    return next({
      statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR,
      message: "internal server error",
    });
  }
};

// update profile

exports.updateProfile = async (req, res, next) => {
  try {
    const body = parseBody(req.body);
    const { error } = profileValidation.validate(body);
    if (error) {
      return next({
        statusCode: STATUS_CODES.BAD_REQUEST,
        message: error.message,
      });
    }
    const userId = mongoose.Types.ObjectId(req.user.id);

    const updatedUser = await updateUser({ _id: userId }, body).exec();
    return generateResponse(updatedUser, "Profile created", res);
  } catch (err) {
    console.log(err);
    return next({
      statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR,
      message: "internal server error",
    });
  }
};
