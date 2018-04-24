import { Router } from 'express';
import * as passport from 'passport';
// import * as PassportLocal from 'passport-local';
const PassportLocal = require('passport-local');
import { User } from '../../user/user.controller';

const LocalStrategy = PassportLocal.Strategy;
const Local = Router();


export const Strategy = new LocalStrategy(async (username: any, password:any, done:any) => {
  try {
    const user = await User.getUser('0000001');
    return done(null, user);
  } catch (err) {
    done(err, false);
  }
});


Local.all('/local', passport.authenticate('local', { successRedirect: '../' }));

export const Routes = Local;

