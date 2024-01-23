"use strict";

const { Router } = require("express");
const {
  createPostController,
  createCommentController,
  createReplyController,
  likeCommentController,
  likePostController,
  likeReplyController,
  getAllPostsController,
  getPostById,
  getAllCommentsController,
  getAllLikesController,
  deletePostController,
  retrieveDeletedPostsController
} = require("../controller/postController");
const auth = require("../middlewares/Auth");
const { ROLES } = require("../utils/constants");
class postAPI {
  constructor() {
    this.router = Router();
    this.setupRoutes();
  }

  setupRoutes() {
    let router = this.router;
    router.post(
      "/create",
      auth([ROLES.USER, ROLES.ADMIN]),
      createPostController
    );
    router.post(
      "/comment/create/:postId",
      auth([ROLES.USER, ROLES.ADMIN]),
      createCommentController
    );
    router.post(
      "/reply/create/:commentId",
      auth([ROLES.USER, ROLES.ADMIN]),
      createReplyController)
    router.patch(
      "/like/:postId",
      auth([ROLES.USER, ROLES.ADMIN]),
      likePostController
    );
    router.patch(
      "/comment/like/:commentId",
      auth([ROLES.USER, ROLES.ADMIN]),
      likeCommentController
    );
    router.patch(
      "/reply/like/:replyId",
      auth([ROLES.USER, ROLES.ADMIN]),
      likeReplyController
    );
    router.get(
      "/",
      auth([ROLES.USER, ROLES.ADMIN]),
      getAllPostsController
    );
    router.get(
      "/:postId",
      auth([ROLES.USER, ROLES.ADMIN]),
      getPostById
    );
    router.get(
      "/:postId/comments",
      auth([ROLES.USER, ROLES.ADMIN]),
      getAllCommentsController
    );
    router.get(
      "/:postId/likes",
      auth([ROLES.USER, ROLES.ADMIN]),
      getAllLikesController
    );
    router.delete(
      "/:postId",
      auth([ROLES.USER, ROLES.ADMIN]),
      deletePostController
    );
    router.get(
      "/user/deleted",
      auth([ROLES.USER, ROLES.ADMIN]),
      retrieveDeletedPostsController
    );
  }

  getRouter() {
    return this.router;
  }

  getRouterGroup() {
    return "/posts";
  }
}

module.exports = postAPI;
