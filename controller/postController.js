const {
  createPost,
  findPost,
  updatePost,
  getAllPosts,
} = require("../models/postModel");
const {
  createComment,
  findComment,
  updateComment,
  getAllComments,
  deleteComment,
} = require("../models/commentModel");
const { createReply, findReply, updateReply } = require("../models/replymodel");
const { parseBody, generateResponse } = require("../utils");
const { STATUS_CODES } = require("../utils/constants");
const {
  commentValidation,
  postValidation,
  replyValidation,
} = require("../validation/postValidation");
const mongoose = require("mongoose");
const {
  getPostsQuery,
  getCommentsOfPostQuery,
  getLikedUsersOfPostQuery,
  getDeletedPostsQuery,
  getPostsOfaUserQuery,
  getPostsOfUserTaggedInQuery,
} = require("./queries/postQueries");
const { findRelation } = require("../models/relationModel");

// create post
exports.createPostController = async (req, res, next) => {
  try {
    const body = parseBody(req.body);
    const { content, media, tags } = body;
    const userId = req.user.id;
    const newPost = {
      content,
      media,
      tags: tags ? tags : [],
      postedBy: userId,
    };
    const { error } = postValidation.validate(newPost);
    if (error)
      return next({
        statusCode: STATUS_CODES.BAD_REQUEST,
        message: error.message,
      });

    const post = await createPost(newPost);
    return generateResponse(post, "Post created successfully", res);
  } catch (err) {
    console.log(err.message);
    return next({
      statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR,
      message: "internal server error",
    });
  }
};

// create comment
exports.createCommentController = async (req, res, next) => {
  try {
    const body = parseBody(req.body);
    const { content, media } = body;
    const userId = mongoose.Types.ObjectId(req.user.id);
    const postId = mongoose.Types.ObjectId(req.params.postId);
    const newComment = {
      content,
      media,
      commentedBy: userId,
    };
    const { error } = commentValidation.validate(newComment);
    if (error)
      return next({
        statusCode: STATUS_CODES.BAD_REQUEST,
        message: error.message,
      });
    const comment = await createComment(newComment);
    await updatePost({ _id: postId }, { $push: { comments: comment._id } });

    return generateResponse(comment, "Comment created successfully", res);
  } catch (err) {
    console.log(err.message);
    return next({
      statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR,
      message: "internal server error",
    });
  }
};

// create reply
exports.createReplyController = async (req, res, next) => {
  try {
    const body = parseBody(req.body);
    const { content, media } = body;
    const userId = mongoose.Types.ObjectId(req.user.id);
    const commentId = mongoose.Types.ObjectId(req.params.commentId);
    const newReply = {
      content,
      media,
      repliedBy: userId,
    };
    const { error } = replyValidation.validate(newReply);
    if (error)
      return next({
        statusCode: STATUS_CODES.BAD_REQUEST,
        message: error.message,
      });
    const reply = await createReply(newReply);
    await updateComment({ _id: commentId }, { $push: { replies: reply._id } });
    return generateResponse(reply, "Reply created successfully", res);
  } catch (err) {
    console.log(err.message);
    return next({
      statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR,
      message: "internal server error",
    });
  }
};

// like post
exports.likePostController = async (req, res, next) => {
  try {
    const postId = mongoose.Types.ObjectId(req.params.postId);
    const userId = mongoose.Types.ObjectId(req.user.id);
    const post = await findPost({ _id: postId });
    if (!post)
      return next({
        statusCode: STATUS_CODES.NOT_FOUND,
        message: "Post not found",
      });

    const isLiked = post.likes && post.likes.includes(userId);

    if (isLiked) {
      const updatedPost = await updatePost(
        { _id: postId },
        { $pull: { likes: userId } }
      );

      return generateResponse(
        {
          likeStatus: false,
          likesCount: updatedPost.likes.length,
          commentsCount: updatedPost.comments.length,
        },
        "Post unliked successfully",
        res
      );
    } else {
      const updatedPost = await updatePost(
        { _id: postId },
        { $push: { likes: userId } }
      );

      return generateResponse(
        {
          likeStatus: true,
          likesCount: updatedPost.likes.length,
          commentsCount: updatedPost.comments.length,
        },
        "Post liked successfully",
        res
      );
    }
  } catch (err) {
    console.log(err.message);
    return next({
      statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR,
      message: "internal server error",
    });
  }
};

// like comment
exports.likeCommentController = async (req, res, next) => {
  try {
    const commentId = mongoose.Types.ObjectId(req.params.commentId);
    const userId = req.user.id;
    const comment = await findComment({ _id: commentId });
    if (!comment)
      return next({
        statusCode: STATUS_CODES.NOT_FOUND,
        message: "Comment not found",
      });
    const isLiked = comment.likes?.includes(userId);
    if (isLiked) {
      await updateComment({ _id: commentId }, { $pull: { likes: userId } });

      return generateResponse(
        { likeStatus: false },
        "Comment unliked successfully",
        res
      );
    } else {
      await updateComment({ _id: commentId }, { $push: { likes: userId } });

      return generateResponse(
        { likeStatus: true },
        "Comment liked successfully",
        res
      );
    }
  } catch (err) {
    console.log(err.message);
    return next({
      statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR,
      message: "internal server error",
    });
  }
};

// like reply

exports.likeReplyController = async (req, res, next) => {
  try {
    const replyId = mongoose.Types.ObjectId(req.params.replyId);
    const userId = req.user.id;
    const reply = await findReply({ _id: replyId });
    if (!reply)
      return next({
        statusCode: STATUS_CODES.NOT_FOUND,
        message: "reply not found",
      });
    const isLiked = reply.likes?.includes(userId);
    if (isLiked) {
      await updateReply({ _id: replyId }, { $pull: { likes: userId } });
      return generateResponse(
        { likeStatus: false },
        "reply unliked successfully",
        res
      );
    } else {
      await updateReply({ _id: replyId }, { $push: { likes: userId } });
      return generateResponse(
        { likeStatus: true },
        "reply liked successfully",
        res
      );
    }
  } catch (err) {
    console.log(err.message);
    return next({
      statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR,
      message: "internal server error",
    });
  }
};

// get all posts

exports.getAllPostsController = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page);
    const limit = parseInt(req.query.limit);
    const currentUserId = mongoose.Types.ObjectId(req.user.id);
    // GET user following and followers
    const { following, followers } = await findRelation({
      user: currentUserId,
    });
    const query = getPostsQuery(currentUserId, following, followers);
    const result = await getAllPosts({ query, page, limit });
    return generateResponse(
      { post: result },
      "Posts fetched successfully",
      res
    );
  } catch (error) {
    console.log(error.message);
    return next({
      statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR,
      message: "internal server error",
    });
  }
};
//get post by id
exports.getPostById = async (req, res, next) => {
  try {
    const postId = mongoose.Types.ObjectId(req.params.postId);
    const userId = mongoose.Types.ObjectId(req.user.id);
    const query = getPostsQuery(userId, postId);
    const result = await getAllPosts({ query, page: 1, limit: 1 });
    return generateResponse(
      { post: result.data },
      "Post fetched successfully",
      res
    );
  } catch (error) {
    console.log(error.message);
    return next({
      statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR,
      message: "internal server error",
    });
  }
};

// get all comments of a post

exports.getAllCommentsController = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page);
    const limit = parseInt(req.query.limit);
    const postId = mongoose.Types.ObjectId(req.params.postId);
    const userId = mongoose.Types.ObjectId(req.user.id);

    const post = await findPost({ _id: postId });
    if (!post)
      return next({
        statusCode: STATUS_CODES.NOT_FOUND,
        message: "Post not found",
      });
    const commentIds = post.comments;

    const query = getCommentsOfPostQuery(userId, commentIds);
    const result = await getAllComments({ query, page, limit });
    return generateResponse(
      { comment: result },
      "Comments fetched successfully",
      res
    );
  } catch (err) {
    console.log(err.message);
    return next({
      statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR,
      message: "internal server error",
    });
  }
};

// get all likes users of a post

exports.getAllLikesController = async (req, res, next) => {
  try {
    const postId = mongoose.Types.ObjectId(req.params.postId);
    const userId = mongoose.Types.ObjectId(req.user.id);
    const post = await findPost({ _id: postId });
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    if (!post)
      return next({
        statusCode: STATUS_CODES.NOT_FOUND,
        message: "Post not found",
      });
    const pipeline = getLikedUsersOfPostQuery(postId, userId);
    const users = await getAllPosts({
      query: pipeline,
      page,
      limit,
      responseKey: "likedUser",
    });
    return generateResponse(users, "liked Users fetched successfully", res);
  } catch (err) {
    console.log(err.message);
    return next({
      statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR,
      message: "internal server error",
    });
  }
};

// delete post
exports.deletePostController = async (req, res, next) => {
  try {
    const postId = mongoose.Types.ObjectId(req.params.postId);
    const userId = mongoose.Types.ObjectId(req.user.id);
    const post = await findPost({ _id: postId });

    if (!post)
      return next({
        statusCode: STATUS_CODES.NOT_FOUND,
        message: "Post not found",
      });
    if (post.postedBy.toString() !== userId.toString())
      return next({
        statusCode: STATUS_CODES.UNAUTHORIZED,
        message: "You are not authorized to delete this post",
      });
    if (post.isDeleted)
      return next({
        statusCode: STATUS_CODES.BAD_REQUEST,
        message: "Post already deleted",
      });
    await updatePost({ _id: postId }, { isDeleted: true });
    return generateResponse(
      { deleteStatus: true },
      "Post deleted successfully",
      res
    );
  } catch (error) {
    console.log(error.message);
    return next({
      statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR,
      message: "internal server error",
    });
  }
};

// retrieve deleted posts

exports.retrieveDeletedPostsController = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page);
    const limit = parseInt(req.query.limit);
    let currentUserId;
    if (req.query.userId) {
      currentUserId = mongoose.Types.ObjectId(req.query.userId);
    } else {
      currentUserId = mongoose.Types.ObjectId(req.user.id);
    }

    const query = getDeletedPostsQuery(currentUserId);
    const result = await getAllPosts({
      query,
      page,
      limit,
      responseKey: "deletedPosts",
    });
    return generateResponse(result, "deleted Posts fetched successfully", res);
  } catch (error) {
    console.log(error.message);
    return next({
      statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR,
      message: "internal server error",
    });
  }
};

//get post of a user
exports.getPostOfUserController = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    let currentUserId;
    if (req.query.userId) {
      currentUserId = mongoose.Types.ObjectId(req.query.userId);
    } else {
      currentUserId = mongoose.Types.ObjectId(req.user.id);
    }
    const query = getPostsOfaUserQuery(currentUserId);
    const result = await getAllPosts({
      query,
      page,
      limit,
      responseKey: "userPosts",
    });
    return generateResponse(result, "Posts fetched successfully", res);
  } catch (error) {
    console.log(error.message);
    return next({
      statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR,
      message: "internal server error",
    });
  }
};

// delete comment

exports.deleteCommentController = async (req, res, next) => {
  try {
    const commentId = mongoose.Types.ObjectId(req.params.commentId);
    const userId = mongoose.Types.ObjectId(req.user.id);
    const comment = await findComment({ _id: commentId });
    const postId = mongoose.Types.ObjectId(req.query.postId);

    if (!comment)
      return next({
        statusCode: STATUS_CODES.NOT_FOUND,
        message: "Comment not found",
      });
    if (comment.commentedBy.toString() !== userId.toString())
      return next({
        statusCode: STATUS_CODES.UNAUTHORIZED,
        message: "You are not authorized to delete this comment",
      });
    await deleteComment({ _id: commentId });
    const updatedPost = await updatePost(
      { _id: postId },
      { $pull: { comments: commentId } }
    );
    console.log(updatedPost);
    return generateResponse(
      { deleteStatus: true },
      "Comment deleted successfully",
      res
    );
  } catch (error) {
    console.log(error.message);
    return next({
      statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR,
      message: "internal server error",
    });
  }
};

// get posts in which a user is tagged in

exports.getPostsOfUserTaggedInController = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const currentUserId = mongoose.Types.ObjectId(req.user.id);
    let userId = req.query.userId;

    let query;
    if (!userId) {
      query = getPostsOfUserTaggedInQuery(currentUserId);
    } else {
      userId = mongoose.Types.ObjectId(userId);
      query = getPostsOfUserTaggedInQuery(currentUserId, userId);
    }
    const result = await getAllPosts({
      query,
      page,
      limit,
      responseKey: "taggedPosts",
    });
    return generateResponse(result, "Posts fetched successfully", res);
  } catch (error) {
    console.log(error.message);
    return next({
      statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR,
      message: "internal server error",
    });
  }
};
