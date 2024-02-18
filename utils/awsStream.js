const {
  IvsClient,
  CreateChannelCommand,
  CreateStreamKeyCommand,
  ListStreamKeysCommand,
  GetStreamKeyCommand,
  GetChannelCommand,
} = require("@aws-sdk/client-ivs");

const ivsClient = new IvsClient({
  region: "us-west-2", // e.g., 'us-west-2'
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
  },
});


exports.getViewerCount= async(channelArn) =>{
  try {
    const params = {
      arn: channelArn,
    };
    const command = new GetChannelCommand(params);
    const response = await ivsClient.send(command);
    console.log(response)
    const viewerCount = response.channel?.ingestEndpoint?.stats?.currentViewerCount || 0;
    console.log("Viewer count:", viewerCount);
    return viewerCount;
  } catch (error) {
    console.error("Error retrieving viewer count:", error);
    throw error;
  }
}


exports.getStreamKeysForChannel=async (channelArn)=> {
  const command = new ListStreamKeysCommand({ channelArn });
  try {
    const response = await ivsClient.send(command);
    return response.streamKeys; // This will be an array of stream keys
  } catch (error) {
    console.error("Error listing stream keys:", error);
    throw error;
  }
}
exports.getStreamKeyValue=async(streamKeyArn) =>{
  const command = new GetStreamKeyCommand({ arn: streamKeyArn });
  try {
      const response = await ivsClient.send(command);
      return response.streamKey.value; // This gives you the actual stream key value
  } catch (error) {
      console.error("Error retrieving stream key:", error);
      throw error;
  }
}

exports.getIngestEndpoint= async(channelArn)=> {
  const command = new GetChannelCommand({ arn: channelArn });

  try {
    const response = await ivsClient.send(command);
    return response.channel.ingestEndpoint;
  } catch (error) {
    console.error("Error retrieving channel details:", error);
    throw error;
  }
};
exports.createStreamKey = async (channelArn) => {
  const command = new CreateStreamKeyCommand({ channelArn });

  try {
    const response = await ivsClient.send(command);
    return response.streamKey;
  } catch (error) {
    console.error("Error creating stream key:", error);
    throw error;
  }
};

exports.createChannel = async (name) => {
  const command = new CreateChannelCommand({
    name,
    type: "STANDARD", // or "BASIC"
    tags: {
      CloudWatchMetricsEnabled: "true", // Tag to enable CloudWatch metrics
    },
  });

  try {
    const response = await ivsClient.send(command);
    return response.channel;
  } catch (error) {
    console.error("Error creating channel:", error);
    throw error;
  }
};
