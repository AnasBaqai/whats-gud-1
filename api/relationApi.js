"use strict";

const { Router } = require("express");
const { toggleFollowUser,getProfileCount } = require("../controller/relationController");
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
    router.get(
      "/profile/count",
      auth([ROLES.USER, ROLES.ADMIN]),
      getProfileCount
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
