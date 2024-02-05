const { Schema, model } = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");
const { getMongooseAggregatePaginatedData } = require("../utils");

const userChannelSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    channelUrl: {
      type: String,
      required: true,
    },
    streamKey: {
      type: String,
      required: true,
    },
    playBackUrl: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

userChannelSchema.plugin(mongoosePaginate);
userChannelSchema.plugin(aggregatePaginate);

const UserChannelModel = model("UserChannel", userChannelSchema);

exports.createUserChannel = (obj) => UserChannelModel.create(obj);

exports.findUserChannel = (query) => UserChannelModel.findOne(query);