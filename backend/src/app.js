'use strict';

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const config = require('./config/env');
const logger = require('./utils/logger');
const { requestLogger } = require('./middlewares/request.middleware');
const { errorHandler } = require('./middlewares/error.middleware');
const authRoutes = require('./modules/auth/auth.routes');
const { authenticate } = require('./middlewares/auth.middleware');

const app = express();

app.use(helmet());
app.use(cors({
  origin: config.CLIENT_URL,
  credentials: true
}));
app.use(cookieParser());
app.use(express.json());
app.use(requestLogger);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' }
});
app.use('/api/', limiter);

const passport = require('passport');
require('./modules/auth/oauth/google/strategy');
require('./modules/auth/oauth/github/strategy');
app.use(passport.initialize());

app.use('/api/auth', authRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/protected', authenticate, (req, res) => {
  res.json({
    message: 'You have accessed a protected resource',
    user: { id: req.user.id, email: req.user.email }
  });
});

app.use(errorHandler);

module.exports = app;
