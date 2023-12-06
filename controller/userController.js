'use strict';
const { STATUS_CODES } = require('../utils/constants');
const { parseBody, generateResponse } = require('../utils');
const { updateUser } = require('../models/userModel');
const { updateProfileValidation } = require('../validation/userValidation');
const { findManyEventsByIds } = require('../models/eventTypeModel');
const mongoose = require('mongoose');
// Function to update user profile
exports.createProfile = async(req,res,next)=>{
  try{
    const body = parseBody(req.body);
    const {preferredEvents,firstName,lastName,dob,image,location,gender}= body;
    const {error} = updateProfileValidation.validate(body);
    console.log(location)
    // Validate and parse longitude and latitude
    const longitude = parseFloat(location.coordinates[0]);
    const latitude = parseFloat(location.coordinates[1]);
    console.log(longitude)
    console.log(latitude)
    // Check if parsing was successful
    if (isNaN(longitude) || isNaN(latitude)) {
      return next({
        statusCode: STATUS_CODES.BAD_REQUEST,
        message: 'Invalid longitude or latitude values.',
      });
    }
    if(error) return next(
      { statusCode: STATUS_CODES.BAD_REQUEST,
        message: error.message 
      });
    const user = req.user;
    console.log(user)
    const eventsIds = await findManyEventsByIds(preferredEvents)
    const updatedUser = await updateUser({_id:mongoose.Types.ObjectId( user.id)},{ preferredEvents:eventsIds,firstName,lastName,dob,image,
      location,gender})
    return generateResponse(updatedUser, 'Profile created', res);
  }catch(error){
    return next({
      statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR,
      message: error.message
    })
  }
}