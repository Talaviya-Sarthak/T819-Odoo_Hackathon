'use strict';

require('tsx/cjs');

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
const ordersRoutes = require('./modules/orders/orders.routes');
const warehousesRoutes = require('./modules/warehouses/warehouses.routes');
const inventoryRoutes = require('./modules/inventory/inventory.routes');
const backordersRoutes = require('./modules/backorders/backorders.routes');
const analyticsRoutes = require('./modules/analytics/analytics.routes');
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
  max: config.NODE_ENV === 'test' ? 10000 : 500,
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
app.use('/api/fulfillment', fulfillmentRoutes);
app.use('/api/fulfillments', fulfillmentRoutes);
app.use('/api', billingRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api', negotiationsRoutes);
app.use('/api', recommendationsRoutes);
app.use('/api', dealHealthRoutes);
app.use('/api', reportsRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/warehouses', warehousesRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/backorders', backordersRoutes);
app.use('/api/analytics', analyticsRoutes);
// Audit logs endpoint (Admin & Manager)
const { listAuditLogs } = require('./services/audit.service');
const { requireRole } = require('./middlewares/role.middleware');
app.get('/api/audit-logs', authenticate, requireRole(['ADMIN', 'SALES_MANAGER', 'MANAGER_ADMIN']), async (req, res, next) => {
  try {
    const logs = await listAuditLogs(req.query);
    sendSuccess(res, 200, 'Audit logs fetched', { auditLogs: logs });
  } catch (err) {
    next(err);
  }
});

// AI, RAG & Knowledge Base routes (Migrated from TCS-Hackathon)
const aiRoutes = require('./ai/routes/ai.routes').default || require('./ai/routes/ai.routes');
const aiAdminRoutes = require('./ai/routes/admin.routes').default || require('./ai/routes/admin.routes');
const uploadsRoutes = require('./uploads/upload.routes').default || require('./uploads/upload.routes');
const ragRoutes = require('./ai/routes/rag.routes').default || require('./ai/routes/rag.routes');

app.use('/api/v1/ai', aiRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/v1/ai/admin', aiAdminRoutes);
app.use('/api/ai/admin', aiAdminRoutes);
app.use('/api/v1/uploads', uploadsRoutes);
app.use('/api/uploads', uploadsRoutes);
app.use('/api/v1/rag', ragRoutes);
app.use('/api/rag', ragRoutes);

app.use(errorHandler);

module.exports = app;
