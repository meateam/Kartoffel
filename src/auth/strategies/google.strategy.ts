import { Router } from 'express';
import * as passport from 'passport';
// import * as PassportGoogle from 'passport-google-oauth';
const PassportGoogle = require('passport-google-oauth');

const Google = Router();

const GoogleStrategy = PassportGoogle.OAuth2Strategy;
const opts = {
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL, 
};


export const Strategy = 
new GoogleStrategy(
  opts, 
  async(accessToken: string, 
        refreshToken: string, 
        profile: any, 
        done:(error: any, user?:any) => void) => {
    console.log(profile);
    done(null, profile);
  }); 

Google.get('/google', passport.authenticate('google', { scope: ['email'] }));
Google.get('/google/callback', passport.authenticate('google', {}), (req, res) => {
  res.redirect('/');
});

export const Routes = Google;
