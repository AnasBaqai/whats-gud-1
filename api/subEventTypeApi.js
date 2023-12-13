"use strict";

const { Router } = require("express");
const {
  createSubEventTypeController,
  getAllSubEventsController,
} = require("../controller/subEventTypeController");
const auth = require("../middlewares/Auth");
const { ROLES } = require("../utils/constants");
const { upload } = require("../utils/imageUpload");
class subEventTypeAPI {
  constructor() {
    this.router = Router();
    this.setupRoutes();
  }

  setupRoutes() {
    let router = this.router;
    router.post("/create",createSubEventTypeController);
    router.get("/all",getAllSubEventsController);
  }

  getRouter() {
    return this.router;
  }

  getRouterGroup() {
    return "/sub/event/type";
  }
}

module.exports = subEventTypeAPI;
