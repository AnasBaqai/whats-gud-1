exports.getAllEventsQuery = (mainCategoryId) => {
  return [
    // Match events with the specified main category ID
    {
      $match: { "category.main": mainCategoryId },
    },

    // Populate the main category
    {
      $lookup: {
        from: "eventtypes", // Replace with your EventType collection name
        localField: "category.main",
        foreignField: "_id",
        as: "category.main",
      },
    },
    {
      $unwind: "$category.main",
    },

    // Populate the sub category
    {
      $lookup: {
        from: "subeventtypes", // Replace with your SubEventType collection name
        localField: "category.sub",
        foreignField: "_id",
        as: "subCategories",
      },
    },
    {
      $addFields: {
        "category.sub": "$subCategories",
      },
    },

    // Populate artistDJ if it contains the ID
    {
      $lookup: {
        from: "users",
        let: { artistDJId: "$artistDJ.id" },
        pipeline: [
          { $match: { $expr: { $eq: ["$_id", "$$artistDJId"] } } },
          { $project: { firstName: 1, lastName: 1, email: 1, image: 1 } },
        ],
        as: "artistDJInfo",
      },
    },
    {
      $addFields: {
        artistDJ: {
          $cond: {
            if: { $gt: [{ $size: "$artistDJInfo" }, 0] },
            then: {
              // Construct the object using fields from artistDJInfo and artistDJ.name
              $let: {
                vars: {
                  artistDJDetails: { $arrayElemAt: ["$artistDJInfo", 0] },
                },
                in: {
                  id: "$$artistDJDetails._id",
                  firstName: "$$artistDJDetails.firstName",
                  lastName: "$$artistDJDetails.lastName",
                  email: "$$artistDJDetails.email",
                  image: "$$artistDJDetails.image",
                  name: "$artistDJ.name", // Retain the original name
                },
              },
            },
            else: "$artistDJ",
          },
        },
      },
    },

    // Populate creator field
    {
      $lookup: {
        from: "users", // Replace with your User collection name
        localField: "creator",
        foreignField: "_id",
        as: "creatorInfo",
      },
    },
    {
      $unwind: "$creatorInfo",
    },
    {
      $addFields: {
        creator: {
          id: "$creatorInfo._id",
          firstName: "$creatorInfo.firstName",
          lastName: "$creatorInfo.lastName",
          email: "$creatorInfo.email",
          image: "$creatorInfo.image",
        },
      },
    },

    // Project the final structure
    {
      $project: {
        // Include fields that you need in the final output
        "category.main": "$category.main.name",
        "category.sub": "$category.sub.name",
        eventName: 1,
        artistDJ: 1,
        description: 1,
        dateAndTime: 1,
        ticketPrice: 1,
        address: 1,
        location: 1,
        coverImage: 1,
        creator: 1,
      },
    },
  ];
};
