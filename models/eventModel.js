const { Schema, model } = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");
const { getMongooseAggregatePaginatedData } = require("../utils");
const {EVENT_STATUS} = require("../utils/constants");
const eventSchema = new Schema(
  {
    category: {
      main: {
        type: Schema.Types.ObjectId,
        ref: "EventType",
        required: true,
      },
      sub: [{
        type: Schema.Types.ObjectId,
        ref: "subEventType",
        required: true,
      }],
    },
    eventName: {
      type: String,
      required: true,
    },
    artistDJ: {
      id: { 
        type: Schema.Types.ObjectId, 
        ref: 'User', 
        // required: function() { return !this.artistDJ.name; } 
        required: false 
      },
      name: { 
        type: String, 
        // required: function() { return !this.artistDJ.id; } // Name is required if no ID is provided
        required: false
      }
    },
    description: {
      type: String,
      required: true,
      maxlength: 1000, // Based on 'max 1000 words' from the form
    },
    dateAndTime: {
      type: Date,
      required: true,
    },
    ticketPrice: {
      type: Number,
      required: false, // Assuming 'optional' from the form
    },
    address: {
      type: String,
      required: false, // Assuming 'optional' from the form
      default:null
    },
    location: {
      type: {
        type: String,
        enum: ["Point"], // Restrict type to 'Point'
        default: "Point",
      },
      coordinates: {
        type: [Number],
        default: [0, 0], // Default coordinates if not provided
      },
    },
    coverImage: {
      type: String, // This will hold the URL to the image
      default: null,
      // required: true,
    },
    creator: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    capacity: { type: Number, required: true },
    isApproved: { type: Boolean, default: false },
    favorites: [{ type: Schema.Types.ObjectId, ref: "User" }],
    status: { type: String, default: EVENT_STATUS.REVIEWING, enum: Object.values(EVENT_STATUS) },
    
    // Additional fields like 'created_at', 'updated_at', or 'isApproved' can be added as needed
  },
  { timestamps: true }
); // This will add 'created_at' and 'updated_at' fields automatically

eventSchema.plugin(mongoosePaginate);
eventSchema.plugin(aggregatePaginate);
eventSchema.index({ "location.coordinates": "2dsphere" });
const Event = model("Event", eventSchema);

// create new event
exports.createEvent = (obj) => Event.create(obj);

// find event by query
exports.findEvent = (query) => Event.findOne(query);

//update event

exports.updateEvent = (query, obj) =>Event.findOneAndUpdate(query, obj, { new: true });

// delete event
exports.deleteEvent = (query) => Event.findOneAndDelete(query);
//count documents 
exports.countEventDocumentsByUser = (query) => Event.countDocuments(query);
//find many events
exports.findManyEvents = (query) => Event.aggregate(query);

exports.getAllEvents = async ({ query, page, limit, responseKey = "data" }) => {
  const { data, pagination } = await getMongooseAggregatePaginatedData({
    model: Event,
    query,
    page,
    limit,
  });

  return { [responseKey]: data, pagination };
};

