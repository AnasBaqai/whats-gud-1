'use strict';

const { Router } = require('express')
const {createEvent} = require('../controller/eventTypeController');
class eventAPI {
    constructor() {
        this.router = Router();
        this.setupRoutes();
    }

    setupRoutes() {
        let router = this.router;
       router.post('/create', createEvent);
    }

    getRouter() {
        return this.router;
    }

    getRouterGroup() {
        return '/event/type';
    }
}

module.exports = eventAPI;