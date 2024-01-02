'use strict';

const { Router } = require('express')
const {loginUser,registerUser,googleCallback, facebookCallback,verifyUser } = require('../controller/AuthController');
const passport = require('passport');
class authAPI {
    constructor() {
        this.router = Router();
        this.setupRoutes();
    }

    setupRoutes() {
        let router = this.router;
        router.get('/login', (req, res) => res.json({ message: 'Welcome to the whats-gud' }));
        router.post('/login', loginUser);
        router.post('/register', registerUser);
        router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
        router.get('/google/callback', passport.authenticate('google', { failureRedirect: '/api' }), googleCallback);
        router.get('/facebook', passport.authenticate('facebook', { scope: [ 'email'] }));
        router.get('/facebook/callback', passport.authenticate('facebook', { failureRedirect: '/api' }), facebookCallback);
        router.get('/verify', verifyUser);
    }

    getRouter() {
        return this.router;
    }

    getRouterGroup() {
        return '/auth';
    }
}

module.exports = authAPI;