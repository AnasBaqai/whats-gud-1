'use strict';

const { Router } = require('express')
const { DefaultHandler } = require('../controller/rootController');
const {provideSignedUrl}= require('../utils/s3Upload');
class RootAPI {
    constructor() {
        this.router = Router();
        this.setupRoutes();
    }

    setupRoutes() {
        let router = this.router;
        router.get('/', DefaultHandler);
        router.get('/signedUrl',provideSignedUrl);
    }

    getRouter() {
        return this.router;
    }

    getRouterGroup() {
        return '/';
    }
}

module.exports = RootAPI;