'use strict';

const { Router } = require('express');

const rootApi = require('./rootApi')
const authApi = require('./AuthApi')
const eventTypeApi = require('./eventTypeApi')
const userApi = require('./userApi')
const resetTokenApi = require('./resetTokenApi')
const relationApi = require('./relationApi')
const subEventTypeApi = require('./subEventTypeApi')
const eventApi = require('./eventApi')
const ticketApi = require('./ticketAPi')
const categoriesApi = require('./categoriesAPi');
const postAPI = require('./postAPi');

// all API routing files import here like above


class API {
    constructor(app) {
        this.app = app;
        this.router = Router();
        this.routeGroups = [];
    }

    loadRouteGroups() {
        this.routeGroups.push(new rootApi());
        this.routeGroups.push(new authApi());
        this.routeGroups.push(new eventTypeApi());
        this.routeGroups.push(new userApi());
        this.routeGroups.push(new resetTokenApi());
        this.routeGroups.push(new relationApi());
        this.routeGroups.push(new subEventTypeApi());
        this.routeGroups.push(new eventApi());
        this.routeGroups.push(new ticketApi());
        this.routeGroups.push(new categoriesApi());
        this.routeGroups.push(new postAPI());
        // all routes register here like above
    }

    // setContentType(req, res, next) {
    //     res.set('Content-Type', 'application/json');
    //     next();
    // }

    registerGroups() {
        this.loadRouteGroups();
        this.routeGroups.forEach((rg) => {
            console.log('Route group: ' + rg.getRouterGroup());
            this.app.use('/api' + rg.getRouterGroup(), rg.getRouter());
        });
    }
}

module.exports = API;