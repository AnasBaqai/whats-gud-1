const { getViewerCount } = require("../../utils/awsStream");

exports.getStreamersQuery = (currentUserId) => {
  return [
    {
      $group: {
        _id: "$userId",
        numStreams: { $sum: 1 },
        streams: { $push: "$_id" },
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "userInfo",
      },
    },
    {
      $unwind: "$userInfo",
    },
    {
      $lookup: {
        from: "relations",
        let: { followedUserId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$user", currentUserId] },
                  { $in: ["$$followedUserId", "$following"] },
                ],
              },
            },
          },
        ],
        as: "followingStatus",
      },
    },
    {
      $project: {
        _id:0,
        id: "$userInfo._id",
        firstName: "$userInfo.firstName",
        lastName: "$userInfo.lastName",
        email: "$userInfo.email",
        image: "$userInfo.image",
        numStreams: 1,
        // streams: 1,
        isFollowing: { $gt: [{ $size: "$followingStatus" }, 0] }, // Check if the followingStatus array has any elements
      },
    },
    // Sorting stage can be added if needed
  ];
};

exports.getAllStreamsQuery = ()=>{
  return[
    {
      $match: {
        isLive: true,
      },
    },
    {
      $lookup: {
        from: "userchannels",
        localField: "userId",
        foreignField: "userId",
        as: "channel",
      },
    },
    {
      $unwind: "$channel",
    },
    {
      $project: {
        _id: 0,
        userId: 1,
        category: 1,
        streamName: 1,
        streamDescription: 1,
        streamAddress: 1,
        location: 1,
        playBackUrl: 1,
        isLive: 1,
        coverImage: 1,
        channelArn: "$channel.channelUrl",
      },
    },
  ];
}