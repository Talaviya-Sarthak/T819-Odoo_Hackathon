'use strict';

const passport = require('passport');
const { Strategy: GoogleStrategy } = require('passport-google-oauth20');
const config = require('../../../../config/env');
const userRepository = require('../../../../repositories/user.repository');
const jwtService = require('../../jwt/jwt.service');
const logger = require('../../../../utils/logger');

if (config.GOOGLE_CLIENT_ID && config.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
    clientID: config.GOOGLE_CLIENT_ID,
    clientSecret: config.GOOGLE_CLIENT_SECRET,
    callbackURL: config.GOOGLE_CALLBACK_URL
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails?.[0]?.value;
      if (!email) {
        logger.error({ profileId: profile.id }, 'Google OAuth: No email found in profile');
        return done(new Error('No email found in Google profile'), null);
      }

      let user = await userRepository.findByEmail(email);

      if (!user) {
        user = await userRepository.create({
          email,
          name: profile.displayName,
          avatar_url: profile.photos?.[0]?.value,
          email_verified: true
        });
      }

      const token = jwtService.generateAccessToken({ id: user.id, email: user.email });
      const refresh = jwtService.generateRefreshToken({ id: user.id });

      return done(null, user, { accessToken: token, refreshToken: refresh });
    } catch (err) {
      logger.error({ err, profileId: profile?.id }, 'Google OAuth strategy error');
      return done(err, null);
    }
  }));
}

module.exports = passport;
