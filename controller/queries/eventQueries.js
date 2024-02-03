const { EVENT_STATUS } = require("../../utils/constants");
exports.getAllEventsQuery = (ID = null,eventId=null, subCategoryIds = [], currentUserId) => {
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
  }else if (eventId){
    matchCondition= {_id:eventId}
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
        from: "tickets", // This should be the actual name of the tickets collection
        localField: "_id", // The local field on the event document
        foreignField: "eventId", // The field on the ticket document
        as: "soldTickets", // The name for the resulting array
      },
    },
    {
      $addFields: {
        ticketsSold: { $size: "$soldTickets" },
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
        status:{ $ifNull: ["$status", EVENT_STATUS.APPROVED] },
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
        from: "tickets", // This should be the actual name of the tickets collection
        localField: "_id", // The local field on the event document
        foreignField: "eventId", // The field on the ticket document
        as: "soldTickets", // The name for the resulting array
      },
    },
    {
      $addFields: {
        ticketsSold: { $size: "$soldTickets" },
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
        status:{ $ifNull: ["$status", EVENT_STATUS.APPROVED] },
      },
    },
  ];
};

exports.getuserCreatedEventsQuery = (userId,currentUserId) => {
  return [
    {
      $match: {
        creator: userId,
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
        from: "tickets", // This should be the actual name of the tickets collection
        localField: "_id", // The local field on the event document
        foreignField: "eventId", // The field on the ticket document
        as: "soldTickets", // The name for the resulting array
      },
    },
    {
      $addFields: {
        ticketsSold: { $size: "$soldTickets" },
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
        status:{ $ifNull: ["$status", EVENT_STATUS.APPROVED] },
      },
    },
  ];
};


exports.getAllUserEventsQuery= (currentUserId)=>{

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
        dateAndTime:1,
        status: {
          $ifNull: ["$status", EVENT_STATUS.APPROVED],
        }
      },
      
    },
    {
      $sort: {
        dateAndTime: -1 // 1 for ascending order, -1 for descending order
      }
    }
  ]
}