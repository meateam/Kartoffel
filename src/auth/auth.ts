import * as passport from 'passport';
import { User } from '../user/user.controller';
import { IUser } from '../user/user.interface';
import { Request, Response, NextFunction } from 'express';

import { Strategy as LocalStrategy } from './strategies/local.strategy';
import { Strategy as GoogleStrategy } from './strategies/google.strategy';



/**
 * OAuth Strategy
 */

//  passport.use(new OAuth2Strategy({
//     authorizationURL: "http://localhost:3000/api/oauth2/authorize",
//     tokenURL: "http://localhost:3000/api/oauth2/token",
//     clientID: process.env.CLIENT_ID,
//     clientSecret: process.env.CLIENT_SECRET,
//     callbackURL: "http://localhost:4000/auth/callback"
//  }, (accessToken: any, refreshToken, profile, done) => {
//     User.findOne({ authId: accessToken.userId}, (err, existingUser) => {
//         if (err) return done(err);
//         if (existingUser) return done(undefined, existingUser);
//         const tempUser: any = createUser(accessToken.userId , accessToken.value, done);
//     });
//  }));

export function configure() {
  /**
   * serialize & deserialize
   */
  passport.serializeUser<IUser, string>((user, done) => {
    done(undefined, user._id);
  });
  
  passport.deserializeUser(async (userId:string, done) => {
    const user = await User.getUser(userId);
    done(undefined, user);
  });

  /**
   * local strategy
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
  res.redirect('/');
};
