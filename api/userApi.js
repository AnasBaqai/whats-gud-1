'use strict';

const { Router } = require('express')
const {createProfile,uploadProfileImage,updateLocation} = require('../controller/userController');
const auth = require('../middlewares/Auth');
const {ROLES} = require('../utils/constants');
const {upload} = require('../utils/s3Upload');
class userAPI {
    constructor() {
        this.router = Router();
        this.setupRoutes();
    }

    setupRoutes() {
        let router = this.router;
       router.patch('/create',auth([ROLES.USER,ROLES.ADMIN]), createProfile);
       router.post('/upload',auth([ROLES.USER,ROLES.ADMIN]),upload.single('image'),uploadProfileImage);
         router.patch('/location',auth([ROLES.USER,ROLES.ADMIN]),updateLocation);
    }

    getRouter() {
        return this.router;
    }

    getRouterGroup() {
        return '/user';
    }
}

module.exports = userAPI;