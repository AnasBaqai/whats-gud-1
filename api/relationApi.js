"use strict";

const { Router } = require("express");
const {
  toggleFollowUser,
  getProfileCount,
  getAnyUserProfileCount,
  getMutualConnectionList
} = require("../controller/relationController");
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
    router.get(
      "/profile/count/:id",
      auth([ROLES.USER, ROLES.ADMIN]),
      getAnyUserProfileCount
    );
    router.get(
      "/mutual/connection",
      auth([ROLES.USER, ROLES.ADMIN]),
      getMutualConnectionList
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
