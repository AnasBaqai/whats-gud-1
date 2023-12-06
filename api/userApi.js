'use strict';

const { Router } = require('express')
const {createProfile} = require('../controller/userController');
const auth = require('../middlewares/Auth');
const {ROLES} = require('../utils/constants');
class userAPI {
    constructor() {
        this.router = Router();
        this.setupRoutes();
    }

    setupRoutes() {
        let router = this.router;
       router.patch('/create',auth([ROLES.USER,ROLES.ADMIN]), createProfile);
    }

    getRouter() {
        return this.router;
    }

    getRouterGroup() {
        return '/user';
    }
}

module.exports = userAPI;