exports.getPostsQuery = (currentUserId, postId = null) => {
  return [
    {
      $match: postId ? { _id: postId } : {},
    },
    {
      $lookup: {
        from: "users",
        localField: "postedBy",
        foreignField: "_id",
        as: "postedBy",
      },
    },
    {
      $unwind: "$postedBy",
    },
    {
      $project: {
        content: 1,
        media: 1,
        postedBy: {
          firstName: 1,
          lastName: 1,
          email: 1,
          image: 1,
          _id: 1,
        },
        // likes: 1,
        // comments: 1,
        // shares: 1,
        isLiked: {
          $in: [currentUserId, "$likes"],
        },
        numberOfLikes: { $size: "$likes" },
        numberOfComments: { $size: "$comments" },
        numberOfShares: { $size: "$shares" },
        createdAt: 1,
      },
    },
  ];
};

exports.getCommentsOfPostQuery = (currentUserId, commentIds) => {
  return [
    // Match comments by their IDs
    {
      $match: {
        _id: { $in: commentIds },
      },
    },
    // Lookup to get commentedBy user details
    {
      $lookup: {
        from: "users",
        localField: "commentedBy",
        foreignField: "_id",
        as: "commentedBy",
      },
    },
    // Unwind commentedBy array
    {
      $unwind: "$commentedBy",
    },
    // Lookup to get replies details
    {
      $lookup: {
        from: "replies", // Replace with your replies collection name
        localField: "replies",
        foreignField: "_id",
        as: "replies",
      },
    },
    // Unwind replies array
    {
      $unwind: {
        path: "$replies",
        preserveNullAndEmptyArrays: true, // To keep comments without replies
      },
    },
    // Lookup to get repliedBy user details for each reply
    {
      $lookup: {
        from: "users", // Assuming your users collection is named 'users'
        localField: "replies.repliedBy",
        foreignField: "_id",
        as: "replies.repliedBy",
      },
    },
    // Unwind repliedBy array
    {
      $unwind: {
        path: "$replies.repliedBy",
        preserveNullAndEmptyArrays: true, // To keep replies without repliedBy
      },
    },
    // Group replies back into an array
    {
      $group: {
        _id: "$_id",
        content: { $first: "$content" },
        media: { $first: "$media" }, 
        createdAt: { $first: "$createdAt" },
        commentedBy: { $first: "$commentedBy" },
        likes: { $first: "$likes" },
        replies: {
          $push: {
            $cond: [
              { $eq: ["$replies", {}] }, // Check if replies is an empty object
              "$$REMOVE",               // Remove it if true
              "$replies"                // Otherwise, keep the reply
            ]
          }
        }
      },
    },
    // Project to reshape the output
    {
      $project: {
        _id: 1,
        content: 1,
        media: 1,
        createdAt: 1,
        commentedBy: {
          _id: "$commentedBy._id",
          firstName: "$commentedBy.firstName",
          lastName: "$commentedBy.lastName",
          email: "$commentedBy.email",
          image: "$commentedBy.image",
        },
        likesCount: { $size: { $ifNull: ["$likes", []] } },
        isLiked: {
          $in: [currentUserId, { $ifNull: ["$likes", []] }],
        },
        replies: {
          $map: {
            input: "$replies",
            as: "reply",
            in: {
              _id: "$$reply._id",
              content: "$$reply.content",
              media: "$$reply.media",
              createdAt: "$$reply.createdAt",
              repliedBy: {
                _id: "$$reply.repliedBy._id",
                firstName: "$$reply.repliedBy.firstName",
                lastName: "$$reply.repliedBy.lastName",
                email: "$$reply.repliedBy.email",
                image: "$$reply.repliedBy.image",
              },
              likesCount: { $size: { $ifNull: ["$$reply.likes", []] } },
              isLikedReply: {
                $in: [currentUserId, { $ifNull: ["$$reply.likes", []] }],
              },
            },
          },
        },
      },
    },
  ];
};

exports.getLikedUsersOfPostQuery = (postId,currentUserId) => {
  return[
    { $match: { _id: postId } },
    {
      $addFields: {
        likes: {
          $map: {
            input: "$likes",
            as: "like",
            in: {
              like: "$$like",
              idx: { $indexOfArray: ["$likes", "$$like"] }
            }
          }
        }
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: 'likes.like',
        foreignField: '_id',
        as: 'likedUsers',
      },
    },
    {
      $unwind: '$likedUsers',
    },
    {
      $set: {
        likedUsers: {
          $mergeObjects: [
            { $arrayElemAt: ["$likes", { $indexOfArray: ["$likes.like", "$likedUsers._id"] }] },
            "$likedUsers"
          ]
        }
      }
    },
    {
      $sort: { "likedUsers.idx": 1 }
    },
    {
      $lookup: {
        from: 'relations',
        let: { likedUserId: '$likedUsers._id', currentUserId: currentUserId },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$user', '$$currentUserId'] },
                  { $in: ['$$likedUserId', '$following'] },
                ],
              },
            },
          },
        ],
        as: 'relation',
      },
    },
    {
      $addFields: {
        "likedUsers.isFollowing": {
          $cond: {
            if: { $eq: ['$likedUsers._id', currentUserId] },
            then: '$$REMOVE',
            else: { $cond: { if: { $gt: [{ $size: '$relation' }, 0] }, then: true, else: false } },
          },
        },
      },
    },
    {
      $replaceRoot: { newRoot: '$likedUsers' },
    },
    {
      $addFields: {
        idx: '$$REMOVE' // Remove the idx field here
      }
    },
    {
      $project: {
        _id: 1,
        firstName: 1,
        lastName: 1,
        email: 1,
        image: 1,
        isFollowing: 1,
      },
    },
    // ... rest of your pipeline ...
  ]
  
};
 // pipeline with isfollowing coming with current userid
// [
//   { $match: { _id: postId } }, // Match the specific post by ID
//   {
//     $lookup: {
//       from: 'users', // Assuming your User collection is named 'users'
//       localField: 'likes',
//       foreignField: '_id',
//       as: 'likedUsers',
//     },
//   },
//   {
//     $project: {
//       _id: 0, // Exclude the post ID from the result
//       likes: '$likedUsers', // Rename the field to 'likes'
//     },
//   },
//   {
//     $unwind: '$likes', // Unwind the array to separate each liked user
//   },
//   {
//     $replaceRoot: { newRoot: '$likes' }, // Replace the root with the liked user details
//   },
//   {
//     $lookup: {
//       from: 'relations', // Assuming your Relation model is named 'relations'
//       let: { likedUserId: '$_id', currentUserId: currentUserId },
//       pipeline: [
//         {
//           $match: {
//             $expr: {
//               $and: [
//                 { $eq: ['$user', '$$currentUserId'] },
//                 { $in: ['$$likedUserId', '$following'] },
//               ],
//             },
//           },
//         },
//       ],
//       as: 'relation',
//     },
//   },
//   {
//     $addFields: {
//       isFollowing: { $cond: { if: { $gt: [{ $size: '$relation' }, 0] }, then: true, else: false } },
//     },
//   },
//   {
//     $project: {
//       _id: 1,
//       firstName: 1,
//       lastName: 1,
//       email: 1,
//       image: 1,
//       isFollowing: 1,
//     },
//   },
// ]
