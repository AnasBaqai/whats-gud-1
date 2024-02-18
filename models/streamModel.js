const { Schema, model } = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");
const { getMongooseAggregatePaginatedData } = require("../utils");

const streamSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: "EventType",
      required: true,
    },
    streamName: {
      type: String,
      required: true,
    },
    streamDescription: {
      type: String,
      required: true,
    },
    streamAddress: {
      type: String,
      required: true,
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
    playBackUrl: {
      type: String,
      required: true,
    },
    isLive: {
      type: Boolean,
      default: true,
    },
    coverImage: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);
streamSchema.plugin(mongoosePaginate);
streamSchema.plugin(aggregatePaginate);

streamSchema.index({ "location.coordinates": "2dsphere" });

const StreamModel = model("Stream", streamSchema);

exports.createStream = (obj) => StreamModel.create(obj);

exports.findStream = (query) => StreamModel.findOne(query);

exports.findStreams = (query) => StreamModel.find(query);

exports.getAllStreams = async ({ query, page, limit, responseKey = "data" }) => {
  const { data, pagination } = await getMongooseAggregatePaginatedData({
    model: StreamModel,
    query,
    page,
    limit,
  });

  return { [responseKey]: data, pagination };
};
