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
        createdAt: { $first: "$createdAt" },
        commentedBy: { $first: "$commentedBy" },
        likes: { $first: "$likes" },
        replies: { $push: "$replies" },
      },
    },
    // Project to reshape the output
    {
      $project: {
        _id: 1,
        content: 1,
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
