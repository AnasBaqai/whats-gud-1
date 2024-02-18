const {
  createStream,
  getAllStreams,
  findStreams,
} = require("../models/streamModel");
const { generateResponse } = require("../utils");
const { STATUS_CODES } = require("../utils/constants");
const { parseBody } = require("../utils");
const {
  createChannel,
  getStreamKeysForChannel,
  getStreamKeyValue,
  getIngestEndpoint,
  getViewerCount,
} = require("../utils/awsStream");
const { streamValidationSchema } = require("../validation/streamValidation");
const {
  createUserChannel,
  findUserChannel,
} = require("../models/userChannelModel");
const { default: mongoose } = require("mongoose");
const {
  getStreamersQuery,
  getAllStreamsQuery,
} = require("./queries/streamQueries");

exports.createStream = async (req, res, next) => {
  try {
    const body = parseBody(req.body);
    const userId = req.user.id;
    const { error } = streamValidationSchema.validate({ ...body, userId });
    if (error) {
      return next({
        status: STATUS_CODES.BAD_REQUEST,
        message: error.details[0].message,
      });
    }
    let channel;
    const userChannel = await findUserChannel({ userId });
    if (userChannel) {
      channel = userChannel;
      const stream = await createStream({
        ...body,
        userId,
        playBackUrl: channel.playBackUrl,
      });
      return generateResponse(
        { channel, stream },
        "stream created successfully",
        res
      );
    } else {
      channel = await createChannel(userId);
      const streamKeys = await getStreamKeysForChannel(channel.arn);
      const streamKey = await getStreamKeyValue(streamKeys[0].arn);
      const channelData = await createUserChannel({
        userId,
        channelUrl: channel.arn,
        streamKey,
        playBackUrl: channel.playbackUrl,
        ingestUrl: channel.ingestEndpoint,
      });
      const stream = await createStream({
        ...body,
        userId,
        playBackUrl: channel.playbackUrl,
      });
      return generateResponse(
        { channelData, stream },
        "stream created successfully",
        res
      );
    }
  } catch (error) {
    console.log(error.message);
    return next({
      status: STATUS_CODES.INTERNAL_SERVER_ERROR,
      message: "INTERNAL_SERVER_ERROR",
    });
  }
};

// get streamers list
exports.getStreamers = async (req, res, next) => {
  try {
    const userid = mongoose.Types.ObjectId(req.user.id);
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const query = getStreamersQuery(userid);
    const streamers = await getAllStreams({
      query,
      page,
      limit,
      responseKey: "Streamers",
    });

    return generateResponse(streamers, "streamers fetched successfully", res);
  } catch (error) {
    console.log(error.message);
    return next({
      status: STATUS_CODES.INTERNAL_SERVER_ERROR,
      message: "INTERNAL_SERVER_ERROR",
    });
  }
};

// get streams which is live
exports.getStreams = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const query = getAllStreamsQuery();

    const streams = await getAllStreams({
      query,
      page,
      limit,
      responseKey: "streams",
    });

    // const dataWithViewerCount = await Promise.all(
    //   streams.streams.map(async (stream) => {
    //     const { channelArn, playBackUrl } = stream;

    //     const viewerCount = await getViewerCount(channelArn);
    //     return { ...stream, viewerCount };
    //   })
    // );
    return generateResponse(
      streams,
      "streams fetched successfully",
      res
    );
  } catch (error) {
    console.log(error.message);
    return next({
      status: STATUS_CODES.INTERNAL_SERVER_ERROR,
      message: "INTERNAL_SERVER_ERROR",
    });
  }
};
