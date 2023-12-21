const { createPost, findPost, updatePost } = require("../models/postModel");
const {
  createComment,
  findComment,
  updateComment,
} = require("../models/commentModel");
const { createReply, findReply, updateReply } = require("../models/replymodel");
const { parseBody, generateResponse } = require("../utils");
const { STATUS_CODES } = require("../utils/constants");
const {
  commentValidation,
  postValidation,
  replyValidation,
} = require("../validation/postValidation");
const { default: mongoose } = require("mongoose");

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
    const postId = mongoose.Types.ObjectId(req.params.postId);
    const newComment = {
      content,
      media,
    };
    const { error } = commentValidation.validate(newComment);
    if (error)
      return next({
        statusCode: STATUS_CODES.BAD_REQUEST,
        message: error.message,
      });
    const comment = await createComment({
      content,
      media,
    });
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
    const commentId = mongoose.Types.ObjectId(req.params.commentId);
    const newReply = {
      content,
      media,
    };
    const { error } = replyValidation.validate(newReply);
    if (error)
      return next({
        statusCode: STATUS_CODES.BAD_REQUEST,
        message: error.message,
      });
    const reply = await createReply({
      content,
      media,
    });
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
