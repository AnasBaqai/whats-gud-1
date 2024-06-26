const { EVENT_STATUS } = require("../../utils/constants");
exports.getAllEventsQuery = (
  ID = null,
  eventId = null,
  subCategoryIds = [],
  currentUserId
) => {
  let matchCondition;
  const currentDate = new Date();

  // This condition will always be included to match only future events
  const dateCondition = { dateAndTime: { $gte: currentDate } };

  if (ID) {
    matchCondition = {
      $and: [dateCondition, { "category.main": ID }],
    };

    if (subCategoryIds.length > 0) {
      // If subCategoryIds are provided, add them to the condition
      matchCondition.$and.push({ "category.sub": { $in: subCategoryIds } });
    }
  } else if (subCategoryIds.length > 0) {
    // If no mainCategoryId is provided but subCategoryIds are provided,
    // match based on the date and subCategoryIds
    matchCondition = {
      $and: [dateCondition, { "category.sub": { $all: subCategoryIds } }],
    };
  } else if (eventId) {
    matchCondition = { _id: eventId };
  } else {
    // If neither mainCategoryId nor subCategoryIds are provided,
    // match only based on the date
    matchCondition = dateCondition;
  }

  return [
    // Match events with the specified main category ID
    {
      $match: matchCondition,
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
    {
      $lookup: {
        from: "tickets", // Join with the tickets collection
        localField: "_id", // Local field in the event document
        foreignField: "eventId", // Corresponding field in the ticket document
        as: "soldTickets", // The resulting array of matched tickets
      },
    },
    {
      $addFields: {
        ticketsSold: {
          $reduce: {
            input: "$soldTickets",
            initialValue: 0,
            in: { $add: ["$$value", "$$this.quantity"] },
          },
        },
      },
    },
    {
      $addFields: {
        hotnessScore: {
          $cond: {
            if: { $gt: ["$capacity", 0] }, // Avoid division by zero
            then: {
              $multiply: [{ $divide: ["$ticketsSold", "$capacity"] }, 100],
            },
            else: 0,
          },
        },
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

    // Check if currentUserId follows the creator
    {
      $lookup: {
        from: "relations", // Replace with your Relation collection name
        let: { creatorId: "$creator.id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$user", currentUserId] },
                  { $in: ["$$creatorId", "$following"] },
                ],
              },
            },
          },
          { $project: { _id: 1 } }, // Project only the _id as we just need to check existence
        ],
        as: "isFollowingCreator",
      },
    },
    {
      $addFields: {
        isFollowingCreator: { $gt: [{ $size: "$isFollowingCreator" }, 0] },
      },
    },
    // Project the final structure
    {
      $project: {
        // Include fields that you need in the final output
        // "category.main": "$category.main.name",
        // "category.sub": "$category.sub.name",
        "category.main": {
          id: "$category.main._id",
          name: "$category.main.name",
        },
        "category.sub": {
          $map: {
            input: "$category.sub",
            as: "sub",
            in: {
              id: "$$sub._id",
              name: "$$sub.name",
            },
          },
        },
        eventName: 1,
        artistDJ: 1,
        description: 1,
        dateAndTime: 1,
        ticketPrice: 1,
        address: 1,
        location: 1,
        coverImage: 1,
        creator: 1,
        capacity: 1,
        hotnessScore: 1,
        isFollowingCreator: 1,
        isfav: {
          $in: [
            currentUserId,
            {
              $ifNull: ["$favorites", []], // Provide an empty array as the default value if $likes is null
            },
          ],
        },
        ticketsSold: 1,
        createdAt: 1,
        status: { $ifNull: ["$status", EVENT_STATUS.APPROVED] },
      },
    },
  ];
};

exports.getFavEventsQuery = (currentUserId) => {
  return [
    {
      $match: {
        favorites: currentUserId,
      },
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
    {
      $lookup: {
        from: "tickets", // Join with the tickets collection
        localField: "_id", // Local field in the event document
        foreignField: "eventId", // Corresponding field in the ticket document
        as: "soldTickets", // The resulting array of matched tickets
      },
    },
    {
      $addFields: {
        ticketsSold: {
          $reduce: {
            input: "$soldTickets",
            initialValue: 0,
            in: { $add: ["$$value", "$$this.quantity"] },
          },
        },
      },
    },
    {
      $addFields: {
        hotnessScore: {
          $cond: {
            if: { $gt: ["$capacity", 0] }, // Avoid division by zero
            then: {
              $multiply: [{ $divide: ["$ticketsSold", "$capacity"] }, 100],
            },
            else: 0,
          },
        },
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
    // Check if currentUserId follows the creator
    {
      $lookup: {
        from: "relations", // Replace with your Relation collection name
        let: { creatorId: "$creator.id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$user", currentUserId] },
                  { $in: ["$$creatorId", "$following"] },
                ],
              },
            },
          },
          { $project: { _id: 1 } }, // Project only the _id as we just need to check existence
        ],
        as: "isFollowingCreator",
      },
    },
    {
      $addFields: {
        isFollowingCreator: { $gt: [{ $size: "$isFollowingCreator" }, 0] },
      },
    },

    // Project the final structure
    {
      $project: {
        // Include fields that you need in the final output
        // "category.main": "$category.main.name",
        // "category.sub": "$category.sub.name",
        "category.main": {
          id: "$category.main._id",
          name: "$category.main.name",
        },
        "category.sub": {
          $map: {
            input: "$category.sub",
            as: "sub",
            in: {
              id: "$$sub._id",
              name: "$$sub.name",
            },
          },
        },
        eventName: 1,
        artistDJ: 1,
        description: 1,
        dateAndTime: 1,
        ticketPrice: 1,
        address: 1,
        location: 1,
        coverImage: 1,
        creator: 1,
        capacity: 1,
        hotnessScore: 1,
        isFollowingCreator: 1,
        isfav: {
          $in: [
            currentUserId,
            {
              $ifNull: ["$favorites", []], // Provide an empty array as the default value if $likes is null
            },
          ],
        },
        ticketsSold: 1,
        createdAt: 1,
        status: { $ifNull: ["$status", EVENT_STATUS.APPROVED] },
      },
    },
  ];
};

exports.getuserCreatedEventsQuery = (userId, currentUserId) => {
  const currentDate = new Date();
  return [
    {
      $match: {
        creator: userId,
        dateAndTime: { $gte: currentDate },
      },
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
    {
      $lookup: {
        from: "tickets", // Join with the tickets collection
        localField: "_id", // Local field in the event document
        foreignField: "eventId", // Corresponding field in the ticket document
        as: "soldTickets", // The resulting array of matched tickets
      },
    },
    {
      $addFields: {
        ticketsSold: {
          $reduce: {
            input: "$soldTickets",
            initialValue: 0,
            in: { $add: ["$$value", "$$this.quantity"] },
          },
        },
      },
    },
    {
      $addFields: {
        hotnessScore: {
          $cond: {
            if: { $gt: ["$capacity", 0] }, // Avoid division by zero
            then: {
              $multiply: [{ $divide: ["$ticketsSold", "$capacity"] }, 100],
            },
            else: 0,
          },
        },
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
    // Check if currentUserId follows the creator
    {
      $lookup: {
        from: "relations", // Replace with your Relation collection name
        let: { creatorId: "$creator.id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$user", currentUserId] },
                  { $in: ["$$creatorId", "$following"] },
                ],
              },
            },
          },
          { $project: { _id: 1 } }, // Project only the _id as we just need to check existence
        ],
        as: "isFollowingCreator",
      },
    },
    {
      $addFields: {
        isFollowingCreator: { $gt: [{ $size: "$isFollowingCreator" }, 0] },
      },
    },
    // Project the final structure
    {
      $project: {
        // Include fields that you need in the final output
        // "category.main": "$category.main.name",
        // "category.sub": "$category.sub.name",
        "category.main": {
          id: "$category.main._id",
          name: "$category.main.name",
        },
        "category.sub": {
          $map: {
            input: "$category.sub",
            as: "sub",
            in: {
              id: "$$sub._id",
              name: "$$sub.name",
            },
          },
        },
        eventName: 1,
        artistDJ: 1,
        description: 1,
        dateAndTime: 1,
        ticketPrice: 1,
        address: 1,
        location: 1,
        coverImage: 1,
        creator: 1,
        capacity: 1,
        hotnessScore: 1,
        isFollowingCreator: 1,
        isfav: {
          $in: [
            currentUserId,
            {
              $ifNull: ["$favorites", []], // Provide an empty array as the default value if $likes is null
            },
          ],
        },
        ticketsSold: 1,
        createdAt: 1,
        status: { $ifNull: ["$status", EVENT_STATUS.APPROVED] },
      },
    },
  ];
};

exports.getAllUserEventsQuery = (currentUserId) => {
  return [
    {
      $match: {
        creator: currentUserId,
      },
    },
    {
      $project: {
        _id: 1,
        eventName: 1,
        dateAndTime: 1,
        createdAt: 1,
        coverImage: 1,
        status: {
          $ifNull: ["$status", EVENT_STATUS.APPROVED],
        },
      },
    },
    {
      $sort: {
        createdAt: -1, // 1 for ascending order, -1 for descending order
      },
    },
  ];
};

exports.getEventOrganizersQuery = (currentUserId) => {
  return [
    {
      $group: {
        _id: "$creator",
        numEvents: { $sum: 1 }, // Count the number of events for each creator
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "creatorInfo",
      },
    },
    {
      $unwind: "$creatorInfo", // Unwind to get each creator's information
    },
    {
      $lookup: {
        from: "relations",
        let: { creatorId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$user", currentUserId] },
                  { $in: ["$$creatorId", "$following"] },
                ],
              },
            },
          },
          { $project: { _id: 1 } },
        ],
        as: "isFollowingCreator",
      },
    },
    {
      $addFields: {
        isFollowingCreator: { $gt: [{ $size: "$isFollowingCreator" }, 0] },
      },
    },
    {
      $project: {
        _id: 0,
        id: "$creatorInfo._id",
        firstName: "$creatorInfo.firstName",
        lastName: "$creatorInfo.lastName",
        email: "$creatorInfo.email",
        image: "$creatorInfo.image",
        isFollowingCreator: 1,
        numEvents: 1,
      },
    },
  ];
};

exports.getCelebQuery = (currentUserId) => {
  return [
    {
      $match: {
        "artistDJ.id": { $exists: true }, // Filter out documents where artistDJ.id does not exist
      },
    },
    {
      $group: {
        _id: "$artistDJ.id", // Group by artistDJ.id
        eventsPerformed: { $sum: 1 }, // Count the occurrences of each artistDJ.id
        // You can add more fields as needed
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "artistInfo",
      },
    },
    {
      $unwind: "$artistInfo", // Unwind to get each creator's information
    },
    {
      $lookup: {
        from: "relations",
        let: { artistInfoId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$user", currentUserId] },
                  { $in: ["$$artistInfoId", "$following"] },
                ],
              },
            },
          },
          { $project: { _id: 1 } },
        ],
        as: "isFollowingCreator",
      },
    },
    {
      $addFields: {
        isFollowingCreator: { $gt: [{ $size: "$isFollowingCreator" }, 0] },
      },
    },
    {
      $project: {
        _id: 0,
        id: "$artistInfo._id",
        firstName: "$artistInfo.firstName",
        lastName: "$artistInfo.lastName",
        email: "$artistInfo.email",
        image: "$artistInfo.image",
        isFollowingCreator: 1,
        eventsPerformed: 1,
      },
    },
  ];
};

// all user related aggregate / long queries here
exports.searchEventsQuery = (searchTerm = null, currentUserId) => {
  return [
    // Match events with the specified main category ID
    {
      $match: {
        eventName: { $regex: searchTerm, $options: "i" },
        dateAndTime: { $gte: new Date() },
      },
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
    {
      $lookup: {
        from: "tickets", // Join with the tickets collection
        localField: "_id", // Local field in the event document
        foreignField: "eventId", // Corresponding field in the ticket document
        as: "soldTickets", // The resulting array of matched tickets
      },
    },
    {
      $addFields: {
        ticketsSold: {
          $reduce: {
            input: "$soldTickets",
            initialValue: 0,
            in: { $add: ["$$value", "$$this.quantity"] },
          },
        },
      },
    },
    {
      $addFields: {
        hotnessScore: {
          $cond: {
            if: { $gt: ["$capacity", 0] }, // Avoid division by zero
            then: {
              $multiply: [{ $divide: ["$ticketsSold", "$capacity"] }, 100],
            },
            else: 0,
          },
        },
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

    // Check if currentUserId follows the creator
    {
      $lookup: {
        from: "relations", // Replace with your Relation collection name
        let: { creatorId: "$creator.id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$user", currentUserId] },
                  { $in: ["$$creatorId", "$following"] },
                ],
              },
            },
          },
          { $project: { _id: 1 } }, // Project only the _id as we just need to check existence
        ],
        as: "isFollowingCreator",
      },
    },
    {
      $addFields: {
        isFollowingCreator: { $gt: [{ $size: "$isFollowingCreator" }, 0] },
      },
    },
    // Project the final structure
    {
      $project: {
        // Include fields that you need in the final output
        // "category.main": "$category.main.name",
        // "category.sub": "$category.sub.name",
        "category.main": {
          id: "$category.main._id",
          name: "$category.main.name",
        },
        "category.sub": {
          $map: {
            input: "$category.sub",
            as: "sub",
            in: {
              id: "$$sub._id",
              name: "$$sub.name",
            },
          },
        },
        eventName: 1,
        artistDJ: 1,
        description: 1,
        dateAndTime: 1,
        ticketPrice: 1,
        address: 1,
        location: 1,
        coverImage: 1,
        creator: 1,
        capacity: 1,
        hotnessScore: 1,
        isFollowingCreator: 1,
        isfav: {
          $in: [
            currentUserId,
            {
              $ifNull: ["$favorites", []], // Provide an empty array as the default value if $likes is null
            },
          ],
        },
        ticketsSold: 1,
        createdAt: 1,
        status: { $ifNull: ["$status", EVENT_STATUS.APPROVED] },
        type: { $literal: "event" },
      },
    },
    { $sort: { dateAndTime: 1 } },
  ];
};
