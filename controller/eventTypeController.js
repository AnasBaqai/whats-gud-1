
// Import necessary modules
const {createEvent} = require('../models/eventTypeModel');
const { parseBody, generateResponse } = require('../utils');
const { STATUS_CODES } = require('../utils/constants');
// Function to create a new event
 exports.createEvent = async(req,res,next)=>{
  // Create a new event object
  try{
    const body = parseBody(req.body);
    const {name} = body;

    const eventData = {
      name
    };  
    const event = await createEvent(eventData);
    return generateResponse(event,'Event type created successfully',res);
  }catch(error){
    return next({
      statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR,
      message:error.message
  })
}
}