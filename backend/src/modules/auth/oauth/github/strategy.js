'use strict';

const passport = require('passport');
const { Strategy: GitHubStrategy } = require('passport-github2');
const config = require('../../../../config/env');
const userRepository = require('../../../../repositories/user.repository');
const jwtService = require('../../jwt/jwt.service');
const logger = require('../../../../utils/logger');

if (config.GITHUB_CLIENT_ID && config.GITHUB_CLIENT_SECRET) {
  passport.use(new GitHubStrategy({
    clientID: config.GITHUB_CLIENT_ID,
    clientSecret: config.GITHUB_CLIENT_SECRET,
    callbackURL: config.GITHUB_CALLBACK_URL
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails?.[0]?.value || `${profile.username}@github.local`;

      let user = await userRepository.findByEmail(email);

      if (!user) {
        user = await userRepository.create({
          email,
          name: profile.displayName || profile.username,
          avatar_url: profile.photos?.[0]?.value,
          email_verified: true
        });
      }

      const token = jwtService.generateAccessToken({ id: user.id, email: user.email });
      const refresh = jwtService.generateRefreshToken({ id: user.id });

      return done(null, user, { accessToken: token, refreshToken: refresh });
    } catch (err) {
      logger.error({ err, profileId: profile?.id, username: profile?.username }, 'GitHub OAuth strategy error');
      return done(err, null);
    }
  }));
}

module.exports = passport;
