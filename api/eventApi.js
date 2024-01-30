"use strict";

const { Router } = require("express");
const {
  createEventController,
  getAllEventsController,
  getEventByIdController,
  giveEventCount,
  favEventController,
  getFavEventsController,
  getEventsByUserIdController,
  setEventStatusController
} = require("../controller/eventController");
const auth = require("../middlewares/Auth");
const { ROLES } = require("../utils/constants");
const { upload } = require("../utils/s3Upload");
class eventAPI {
  constructor() {
    this.router = Router();
    this.setupRoutes();
  }

  setupRoutes() {
    let router = this.router;
    router.post(
      "/create",
      auth([ROLES.USER, ROLES.ADMIN]),
      upload.single("coverImage"),
      createEventController
    );
    router.post("/all", auth([ROLES.USER, ROLES.ADMIN]), getAllEventsController);
    router.get(
      "/id/:eventId",
      auth([ROLES.USER, ROLES.ADMIN]),
      getEventByIdController
    );
    router.post(
      "/count",
      auth([ROLES.USER, ROLES.ADMIN]),
      giveEventCount
    );
    router.post(
      "/fav/:eventId",
      auth([ROLES.USER, ROLES.ADMIN]),
      favEventController
    );
    router.get(
      "/fav",
      auth([ROLES.USER, ROLES.ADMIN]),
      getFavEventsController
    );
    router.get(
      "/user",
      auth([ROLES.USER, ROLES.ADMIN]),
      getEventsByUserIdController
    );
    router.put(
      "/status/:eventId",
      auth([ROLES.USER, ROLES.ADMIN]),
      setEventStatusController
    );
  }

  getRouter() {
    return this.router;
  }

  getRouterGroup() {
    return "/event";
  }
}

module.exports = eventAPI;
