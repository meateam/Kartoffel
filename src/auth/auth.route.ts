import { Request, Response, NextFunction, Router } from 'express';
import * as passport from 'passport';
import { isAuthenticated } from './auth';
import * as GoogleStrategy from './strategies/google.strategy';
import * as LocalStrategy from './strategies/local.strategy';

function authSuccess(req: Request, res: Response, next: NextFunction) {
  res.redirect('/auth/getUser');
}


const Auth = Router();
Auth.use(GoogleStrategy.getRouter(authSuccess));
Auth.use(LocalStrategy.getRouter(authSuccess));

// Auth.all('/', passport.authenticate('local', { successRedirect: '../' }));

// test route
Auth.get('/getUser', (req, res) => {
  res.json(req.user);
});

export = Auth;
