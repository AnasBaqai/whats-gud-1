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
        from: "users", // Assuming your users collection is named 'users'
        localField: "commentedBy",
        foreignField: "_id",
        as: "commentedBy",
      },
    },
    // Unwind commentedBy array
    {
      $unwind: "$commentedBy",
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
            input: {
              $ifNull: ["$replies", []],
            },
            as: "reply",
            in: {
              _id: "$$reply._id",
              content: "$$reply.content",
              createdAt: "$$reply.createdAt",
              repliedBy: {
                $arrayElemAt: ["$$reply.repliedBy", 0],
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
