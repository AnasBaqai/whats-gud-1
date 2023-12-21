"use strict";

const { Router } = require("express");
const {
  createPostController,
  createCommentController,
  createReplyController
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
  }

  getRouter() {
    return this.router;
  }

  getRouterGroup() {
    return "/posts";
  }
}

module.exports = postAPI;
