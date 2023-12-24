const { Schema, model } = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");
const { getMongooseAggregatePaginatedData } = require("../utils");
const eventTypeSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
});

eventTypeSchema.plugin(mongoosePaginate);
eventTypeSchema.plugin(aggregatePaginate);

const eventTypeModel = model("EventType", eventTypeSchema);

//create utility functions to create, read, update, and delete events

exports.createEventType = (obj) => eventTypeModel.create(obj);

exports.findEventType = (query) => eventTypeModel.findOne(query);

exports.findAllEventTypeByQuery = (query) => eventTypeModel.find(query);

exports.updateEventType = (eventId, obj) =>
  eventTypeModel.findByIdAndUpdate(eventId, obj, { new: true });

exports.deleteEventType = (eventId) => eventTypeModel.findByIdAndDelete(eventId);
// implement findManyEventsByIds function
exports.findManyEventsTypeByIds = (eventIds) =>
  eventTypeModel.find({ _id: { $in: eventIds } });
// write a function to get all events with pagination
exports.getAllEventsType = async ({ query, page, limit, responseKey = "data" }) => {
  const { data, pagination } = await getMongooseAggregatePaginatedData({
    model: eventTypeModel,
    query,
    page,
    limit,
  });

  return { [responseKey]: data, pagination };
};

//module.exports = Event;
