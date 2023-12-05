const { Schema, model } = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");  
const eventTypeSchema = new Schema({
  name: {
    type: String,
    required: true
  }
});

eventTypeSchema.plugin(mongoosePaginate);
eventTypeSchema.plugin(aggregatePaginate);

const eventTypeModel = model('EventType', eventTypeSchema);

//create utility functions to create, read, update, and delete events

exports.createEvent = (obj) => eventTypeModel.create(obj);

exports.findEventById = (eventId) => eventTypeModel.findById(eventId);

exports.updateEvent = (eventId, obj) => eventTypeModel.findByIdAndUpdate(eventId, obj, { new: true });

exports.deleteEvent = (eventId) => eventTypeModel.findByIdAndDelete(eventId);
// implement findManyEventsByIds function
exports.findManyEventsByIds = (eventIds) => eventTypeModel.find({ _id: { $in: eventIds } });
// write a function to get all events with pagination 
exports.getAllEvents = async ({ query, page, limit, responseKey = 'data' }) => {
  const { data, pagination } = await getMongooseAggregatePaginatedData({
    model: eventTypeModel,
    query,
    page,
    limit,
  });

  return { [responseKey]: data, pagination };
};




//module.exports = Event;
