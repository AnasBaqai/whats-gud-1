const {createAvatar,getAllAvatars} = require("../models/avatarModel");
const { parseBody, generateResponse } = require("../utils");
const { STATUS_CODES } = require("../utils/constants");
const { s3Uploadv3 } = require("../utils/s3Upload");
const { avatarValidation } = require("../validation/avatarValidation");

exports.createAvatarController = async (req, res, next) => {
  try {
    const body = parseBody(req.body);
    let url = "";
    if(!req.file){
      return next({
        statusCode: STATUS_CODES.BAD_REQUEST,
        message: "Avatar image is required",
      });
    }
    if (req.file) {
      url = await s3Uploadv3([req.file]);
    }
    const newAvatar = {
      url: url[0],
      ...body,
    };
    const {error} = avatarValidation.validate(newAvatar);
    if (error) {
      return next({
        statusCode: STATUS_CODES.BAD_REQUEST,
        message: error.details[0].message,
      });
    }
    const avatar = await createAvatar(newAvatar);
    return generateResponse(avatar, "Avatar created successfully", res);
  } catch (error) {
    console.log(error.message);
    return next({
      statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR,
      message: "internal server error",
    });
  }
}


// get all avatars

exports.getAllAvatarsController = async (req, res, next) => {
  try {
    const avatars = await getAllAvatars({});
    return generateResponse(avatars, "Avatars fetched successfully", res);
  } catch (error) {
    console.log(error.message);
    return next({
      statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR,
      message: "internal server error",
    });
  }
}