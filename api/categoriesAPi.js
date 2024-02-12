"use strict";

const { Router } = require("express");
const {
  createCategoriesController,
  pushSubCategory,
  getAllCategories,
} = require("../controller/categoriesController");
const auth = require("../middlewares/Auth");
const { ROLES } = require("../utils/constants");

class categoriesAPI {
  constructor() {
    this.router = Router();
    this.setupRoutes();
  }

  setupRoutes() {
    let router = this.router;
    router.post("/create", createCategoriesController);
    router.post("/pushSubCategory/:id", pushSubCategory);
    router.get("/all", auth([ROLES.USER, ROLES.ADMIN]), getAllCategories);
  }

  getRouter() {
    return this.router;
  }

  getRouterGroup() {
    return "/categories";
  }
}

module.exports = categoriesAPI;
