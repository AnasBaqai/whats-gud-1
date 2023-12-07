
// Import necessary modules
const {createEvent,getAllEvents} = require('../models/eventTypeModel');
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


exports.getAllEventsController = async (req, res) => {
  try {
    const page = parseInt(req.query.page);
    const limit = parseInt(req.query.limit);
    
    const skip = (page - 1) * limit;
  const pipeline = [
    { $match: {} },
  ];
    const result = await getAllEvents({ query: pipeline, page, limit });
    res.json(result);
  } catch (error) {
    res.status(500).send(error.message);
  }
};

