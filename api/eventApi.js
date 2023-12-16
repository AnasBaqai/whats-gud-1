'use strict';

const { Router } = require('express')
const {createEventController,getAllEventsController} = require('../controller/eventController');
const auth = require('../middlewares/Auth');
const {ROLES} = require('../utils/constants');
const {upload} = require('../utils/s3Upload');
class eventAPI {
    constructor() {
        this.router = Router();
        this.setupRoutes();
    }

    setupRoutes() {
        let router = this.router;
       router.post('/create',auth([ROLES.USER,ROLES.ADMIN]),upload.single('coverImage'), createEventController);
       router.get('/all',auth([ROLES.USER,ROLES.ADMIN]),getAllEventsController );
    }

    getRouter() {
        return this.router;
    }

    getRouterGroup() {
        return '/event';
    }
}

module.exports = eventAPI;