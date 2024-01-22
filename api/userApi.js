"use strict";

const { Router } = require("express");
const {
  createProfile,
  uploadProfileImage,
  updateLocation,
  getUserProfile,
  createAccessToken,
  searchUsers,
  updateProfile,
  setUserAvatar
} = require("../controller/userController");
const auth = require("../middlewares/Auth");
const { ROLES } = require("../utils/constants");
const { upload } = require("../utils/s3Upload");
class userAPI {
  constructor() {
    this.router = Router();
    this.setupRoutes();
  }

  setupRoutes() {
    let router = this.router;
    router.patch("/create", auth([ROLES.USER, ROLES.ADMIN]), createProfile);
    router.post(
      "/upload",
      auth([ROLES.USER, ROLES.ADMIN]),
      upload.single("image"),
      uploadProfileImage
    );
    router.patch("/location", auth([ROLES.USER, ROLES.ADMIN]), updateLocation);
    router.get("/profile", auth([ROLES.USER, ROLES.ADMIN]), getUserProfile);
    router.post("/token", auth([ROLES.USER, ROLES.ADMIN]), createAccessToken);
    router.get("/lookup", auth([ROLES.USER, ROLES.ADMIN]), searchUsers);
    router.patch("/update", auth([ROLES.USER, ROLES.ADMIN]), updateProfile);
    router.post("/setAvatar", auth([ROLES.USER, ROLES.ADMIN]), setUserAvatar);
  }

  getRouter() {
    return this.router;
  }

  getRouterGroup() {
    return "/user";
  }
}

module.exports = userAPI;
