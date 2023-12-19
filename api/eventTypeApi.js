'use strict';

const { Router } = require('express')
const {createEvent,getAllEventsController} = require('../controller/eventTypeController');
const auth = require('../middlewares/Auth');
const {ROLES} = require('../utils/constants');
class eventTypeAPI {
    constructor() {
        this.router = Router();
        this.setupRoutes();
    }

    setupRoutes() {
        let router = this.router;
       router.post('/create', createEvent);
       router.get('/all',auth([ROLES.USER,ROLES.ADMIN]), getAllEventsController);
    }

    getRouter() {
        return this.router;
    }

    getRouterGroup() {
        return '/event/type';
    }
}

module.exports = eventTypeAPI;