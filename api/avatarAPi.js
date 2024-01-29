'use strict';

const { Router } = require('express')
const { createAvatarController,getAllAvatarsController } = require('../controller/avatarController');
const auth = require('../middlewares/Auth');
const {ROLES} = require('../utils/constants');
const {upload} = require('../utils/s3Upload');
class avatarAPI {
    constructor() {
        this.router = Router();
        this.setupRoutes();
    }

    setupRoutes() {
        let router = this.router;
        router.post('/create', auth([ROLES.USER,ROLES.ADMIN]),upload.single("url"), createAvatarController);
        router.get('/all', auth([ROLES.USER,ROLES.ADMIN]), getAllAvatarsController);
    }

    getRouter() {
        return this.router;
    }

    getRouterGroup() {
        return '/avatar';
    }
}

module.exports = avatarAPI;