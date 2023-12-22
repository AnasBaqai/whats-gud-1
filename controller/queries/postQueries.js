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
      },
    },
  ];
};

exports.getCommentsOfPostQuery = (currentUserId, postId) => {
  return [
    {
      $match: { _id: postId },
    },
    {
      $unwind: "$comments",
    },
    {
      $lookup: {
        from: "users",
        localField: "comments.commentedBy",
        foreignField: "_id",
        as: "comments.commentedBy",
      },
    },
    {
      $unwind: {
        path: "$comments.commentedBy",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: "replies",
        localField: "comments._id",
        foreignField: "commentId",
        as: "comments.replies",
      },
    },
    {
      $unwind: {
        path: "$comments.replies",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "comments.replies.repliedBy",
        foreignField: "_id",
        as: "comments.replies.repliedBy",
      },
    },
    {
      $unwind: {
        path: "$comments.replies.repliedBy",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $group: {
        _id: "$_id",
        comments: {
          $push: "$comments",
        },
        // Include other fields from postSchema as needed
      },
    },
    {
      $project: {
        comments: {
          $map: {
            input: { $ifNull: ["$comments", []] },
            as: "comment",
            in: {
              content: "$$comment.content",
              media: "$$comment.media",
              commentedBy: "$$comment.commentedBy",
              isLiked: {
                $in: [currentUserId, { $ifNull: ["$$comment.likes", []] }],
              },
              numberOfLikes: { $size: { $ifNull: ["$$comment.likes", []] } },
              replies: {
                $map: {
                  input: { $ifNull: ["$$comment.replies", []] },
                  as: "reply",
                  in: {
                    content: "$$reply.content",
                    media: "$$reply.media",
                    repliedBy: "$$reply.repliedBy",
                    isLikedReply: {
                      $in: [currentUserId, { $ifNull: ["$$reply.likes", []] }],
                    },
                    numberOfLikes: {
                      $size: { $ifNull: ["$$reply.likes", []] },
                    },
                  },
                },
              },
            },
          },
        },
        // Include other fields from postSchema as needed
      },
    },
  ];
};
