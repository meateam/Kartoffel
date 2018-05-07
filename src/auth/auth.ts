import * as passport from 'passport';
import { User } from '../user/user.controller';
import { IUser } from '../user/user.interface';
import { Request, Response, NextFunction } from 'express';

import { Strategy as LocalStrategy } from './strategies/local.strategy';
import { Strategy as GoogleStrategy } from './strategies/google.strategy';


export function configure() {
  /**
   * serialize & deserialize
   */
  passport.serializeUser<IUser, string>((user, done) => {
    done(undefined, user._id);
  });
  
  passport.deserializeUser(async (userId:string, done) => {
    const user = {
      _id: userId,
      name: 'stam',
    };
    if (userId === 'eladex@gmail.com') {
      user.name = 'rabbiran';
    }
    // const user = await User.getUser(userId);
    done(undefined, user);
  });

  /**
   * use local strategy and google strategy
   */
  passport.use(LocalStrategy);
  passport.use(GoogleStrategy);

}


 /**
  * Login Required middleware.
  */
export let isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect(`/auth/${process.env.AUTH_STRATEGY}`);
};
