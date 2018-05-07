import { Router, Request, Response, NextFunction } from 'express';
import * as passport from 'passport';
// import * as PassportLocal from 'passport-local';
const PassportLocal = require('passport-local');
import { User } from '../../user/user.controller';

const LocalStrategy = PassportLocal.Strategy;

export const Strategy = new LocalStrategy(async (username: any, password:any, done:any) => {
  try {
    const user = await User.getUser('0000001');
    return done(null, user);
  } catch (err) {
    done(err, false);
  }
});


// Local.all('/local', passport.authenticate('local', { successRedirect: '../' }));


export function getRouter(
successHandler?:(req: Request, res: Response, next: NextFunction) => any) {
  const Local = Router();  
  Local.get('/local', passport.authenticate('local'), successHandler);
  return Local;
}
   

// export const Routes = Local;

