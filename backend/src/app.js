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
const productsRoutes = require('./modules/products/products.routes');
const customersRoutes = require('./modules/customers/customers.routes');
const quotationsRoutes = require('./modules/quotations/quotations.routes');
const discountsRoutes = require('./modules/discounts/discounts.routes');
const approvalsRoutes = require('./modules/approvals/approvals.routes');
const fulfillmentRoutes = require('./modules/fulfillment/fulfillment.routes');
const billingRoutes = require('./modules/billing/billing.routes');
const negotiationsRoutes = require('./modules/negotiations/negotiations.routes');
const recommendationsRoutes = require('./modules/recommendations/recommendations.routes');
const dealHealthRoutes = require('./modules/deal-health/deal-health.routes');
const reportsRoutes = require('./modules/reports/reports.routes');
const { authenticate } = require('./middlewares/auth.middleware');
const rbacService = require('./services/rbac.service');
const { sendSuccess } = require('./utils/response');

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
    user: { id: req.user.id, email: req.user.email, role: req.user.role }
  });
});

// Navigation API - returns authenticated user's authorized navigation
app.get('/api/navigation', authenticate, async (req, res, next) => {
  try {
    const authContext = await rbacService.getUserAuthContext(req.user.id);
    sendSuccess(res, 200, 'Navigation fetched', {
      navigation: authContext.navigation,
      portal: authContext.portal,
      permissions: authContext.permissions,
    });
  } catch (err) {
    next(err);
  }
});

// Role-based portal routes
app.use('/api/sales', require('./modules/sales/sales.routes'));
app.use('/api/management', require('./modules/management/management.routes'));
app.use('/api/operations', require('./modules/operations/operations.routes'));
app.use('/api/customer', require('./modules/customer/customer.routes'));

// Business domain routes
app.use('/api/products', productsRoutes);
app.use('/api/customers', customersRoutes);
app.use('/api/quotations', quotationsRoutes);
app.use('/api', discountsRoutes);
app.use('/api/approvals', approvalsRoutes);
app.use('/api', fulfillmentRoutes);
app.use('/api', billingRoutes);
app.use('/api', negotiationsRoutes);
app.use('/api', recommendationsRoutes);
app.use('/api', dealHealthRoutes);
app.use('/api', reportsRoutes);

app.use(errorHandler);

module.exports = app;
