'use strict';

const { Router } = require('express')
const { createNewTicket,verifyTicket, stripeOnBoarding,reAuth,onBoardingComplete} = require('../controller/ticketController');
const auth = require('../middlewares/Auth');
const {ROLES} = require('../utils/constants');

class ticketAPI {
    constructor() {
        this.router = Router();
        this.setupRoutes();
    }

    setupRoutes() {
        let router = this.router;
        router.post('/create',auth([ROLES.USER,ROLES.ADMIN]), createNewTicket);
        router.get('/barcode/verify', verifyTicket);
        router.get('/stripe/onboarding',auth([ROLES.USER,ROLES.ADMIN]), stripeOnBoarding);
        router.get('/stripe/reauth', reAuth);
        router.get('/stripe/onboarding-complete', onBoardingComplete);

    }

    getRouter() {
        return this.router;
    }

    getRouterGroup() {
        return '/ticket';
    }
}

module.exports = ticketAPI;