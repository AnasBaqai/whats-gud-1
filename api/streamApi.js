'use strict';

const { Router } = require('express')
const {ROLES} = require('../utils/constants');
const {createStream}= require('../controller/streamController');
const auth = require("../middlewares/Auth");
class streamAPI {
    constructor() {
        this.router = Router();
        this.setupRoutes();
    }

    setupRoutes() {
        let router = this.router;
        router.post('/',auth([ROLES.USER, ROLES.ADMIN]),createStream);
      }    

    getRouter() {
        return this.router;
    }

    getRouterGroup() {
        return '/stream';
    }
}

module.exports = streamAPI;