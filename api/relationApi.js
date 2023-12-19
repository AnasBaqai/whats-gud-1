"use strict";

const { Router } = require("express");
const { toggleFollowUser } = require("../controller/relationController");
const auth = require("../middlewares/Auth");
const { ROLES } = require("../utils/constants");
class relationAPI {
  constructor() {
    this.router = Router();
    this.setupRoutes();
  }

  setupRoutes() {
    let router = this.router;
    router.post(
      "/toggle/follow",
      auth([ROLES.USER, ROLES.ADMIN]),
      toggleFollowUser
    );
  }

  getRouter() {
    return this.router;
  }

  getRouterGroup() {
    return "/relation";
  }
}

module.exports = relationAPI;
