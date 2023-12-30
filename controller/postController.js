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
const { getPostsQuery, getCommentsOfPostQuery } = require("./queries/postQueries");

// create post
exports.createPostController = async (req, res, next) => {
  try {
    const body = parseBody(req.body);
    const { content, media } = body;
    const userId = req.user.id;
    const newPost = {
      content,
      media,
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
      await updatePost({ _id: postId }, { $pull: { likes: userId } });

      return generateResponse(
        { likeStatus: false },
        "Post unliked successfully",
        res
      );
    } else {
      await updatePost({ _id: postId }, { $push: { likes: userId } });

      return generateResponse(
        { likeStatus: true },
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
    const query = getPostsQuery(currentUserId);
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
    return generateResponse({ post: result.data }, "Post fetched successfully", res);
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
  try{
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
  }catch(err){
    console.log(err.message)
    return next({
      statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR,
      message: "internal server error",
    });
  }
};
