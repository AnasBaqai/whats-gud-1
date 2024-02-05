const { createStream } = require("../models/streamModel");
const { generateResponse } = require("../utils");
const { STATUS_CODES } = require("../utils/constants");
const { parseBody } = require("../utils");
const {
  createChannel,
  getStreamKeysForChannel,
  getStreamKeyValue,
} = require("../utils/awsStream");
const { streamValidationSchema } = require("../validation/streamValidation");
const {
  createUserChannel,
  findUserChannel,
} = require("../models/userChannelModel");

exports.createStream = async (req, res, next) => {
  try {
    const body = parseBody(req.body);
    const userId = req.user.id;
    const { error } = streamValidationSchema.validate({ ...body, userId });
    if (error) {
      console.log("error coming from here");
      return next({
        status: STATUS_CODES.BAD_REQUEST,
        message: error.details[0].message,
      });
    }
    let channel;
    const userChannel = await findUserChannel({ userId });
    if (userChannel) {
      console.log("if working")
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
      console.log("else working")
      channel = await createChannel(userId);
      const streamKeys = await getStreamKeysForChannel(channel.arn);
      const streamKey = await getStreamKeyValue(streamKeys[0].arn);
      await createUserChannel({
        userId,
        channelUrl: channel.arn,
        streamKey,
        playBackUrl: channel.playbackUrl,
      });
      const stream = await createStream({
        ...body,
        userId,
        playBackUrl: channel.playbackUrl,
      });
      return generateResponse(
        { channel, stream },
        "stream created successfully",
        res
      );
    }
  } catch (error) {
    return next({ status: STATUS_CODES.INTERNAL_SERVER_ERROR, message: error });
  }
};
