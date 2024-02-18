'use strict';

const { Router } = require('express')
const {ROLES} = require('../utils/constants');
const {createStream,getStreamers,getStreams}= require('../controller/streamController');
const auth = require("../middlewares/Auth");
class streamAPI {
    constructor() {
        this.router = Router();
        this.setupRoutes();
    }

    setupRoutes() {
        let router = this.router;
        router.post('/',auth([ROLES.USER, ROLES.ADMIN]),createStream);
        router.get('/streamers',auth([ROLES.USER, ROLES.ADMIN]),getStreamers);
        router.get('/get/streams',auth([ROLES.USER, ROLES.ADMIN]),getStreams);
      }    

    getRouter() {
        return this.router;
    }

    getRouterGroup() {
        return '/stream';
    }
}

module.exports = streamAPI;