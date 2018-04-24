import { Request, Response, NextFunction, Router } from 'express';
import * as passport from 'passport';
import { isAuthenticated } from './auth';
import { Routes as GoogleAuthRouter } from './strategies/google.strategy';
import { Routes as LocalAuthRouter } from './strategies/local.strategy';

const Auth = Router();
Auth.use(GoogleAuthRouter);
Auth.use(LocalAuthRouter);

// Auth.all('/', passport.authenticate('local', { successRedirect: '../' }));

// test route
Auth.get('/getUser', (req, res) => {
  res.json(req.user);
});

export = Auth;
