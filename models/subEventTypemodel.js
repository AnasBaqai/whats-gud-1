const { Schema, model } = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");
const { getMongooseAggregatePaginatedData } = require("../utils");
const subEventTypeSchema = new Schema({
  eventType: {
    type: Schema.Types.ObjectId,
    ref: "EventType",
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
});

subEventTypeSchema.plugin(mongoosePaginate);
subEventTypeSchema.plugin(aggregatePaginate);

const subEventTypeModel = model("subEventType", subEventTypeSchema);

//create utility functions to create, read, update, and delete events

exports.createSubEventType = (obj) => subEventTypeModel.create(obj);

exports.findSubEventTypeById = (subEventId) =>
  subEventTypeModel.findById(subEventId);

exports.updateEvent = (subEventId, obj) =>
  subEventTypeModel.findByIdAndUpdate(subEventId, obj, { new: true });

exports.deleteEvent = (eventId) => subEventTypeModel.findByIdAndDelete(eventId);
// implement findManyEventsByIds function
exports.findManyEventsByIds = (eventIds) =>
  subEventTypeModel.find({ _id: { $in: eventIds } });
// write a function to get all events with pagination
exports.getAllSubEventstype = async ({
  query,
  page,
  limit,
  responseKey = "data",
}) => {
  const { data, pagination } = await getMongooseAggregatePaginatedData({
    model: subEventTypeModel,
    query,
    page,
    limit,
  });

  return { [responseKey]: data, pagination };
};

//module.exports = Event;
