'use strict';

const { Router } = require('express')
const {createEvent,getAllEventsController} = require('../controller/eventTypeController');
class eventTypeAPI {
    constructor() {
        this.router = Router();
        this.setupRoutes();
    }

    setupRoutes() {
        let router = this.router;
       router.post('/create', createEvent);
       router.get('/all', getAllEventsController);
    }

    getRouter() {
        return this.router;
    }

    getRouterGroup() {
        return '/event/type';
    }
}

module.exports = eventTypeAPI;