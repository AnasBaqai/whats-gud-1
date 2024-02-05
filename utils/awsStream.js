const {
  IvsClient,
  CreateChannelCommand,
  CreateStreamKeyCommand,
  ListStreamKeysCommand,
  GetStreamKeyCommand,
} = require("@aws-sdk/client-ivs");

const ivsClient = new IvsClient({
  region: "us-west-2", // e.g., 'us-west-2'
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
  },
});

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
  });

  try {
    const response = await ivsClient.send(command);
    return response.channel;
  } catch (error) {
    console.error("Error creating channel:", error);
    throw error;
  }
};
