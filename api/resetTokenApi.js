'use strict';

const { Router } = require('express')
const {mailToken,verifyToken,resetPassword,verifyconfirmation} = require('../controller/resetTokenController');
class resetTokenAPI {
    constructor() {
        this.router = Router();
        this.setupRoutes();
    }

    setupRoutes() {
       let router = this.router;
       router.post('/mail', mailToken);
       router.get('/verify', verifyToken);
       router.post('/confirmation', verifyconfirmation);
       router.patch('/password', resetPassword);
       
    }

    getRouter() {
        return this.router;
    }

    getRouterGroup() {
        return '/reset/token';
    }
}

module.exports = resetTokenAPI;