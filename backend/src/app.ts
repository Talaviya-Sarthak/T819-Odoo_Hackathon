import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';

import { config } from './common/config';
import authRoutes from './auth/auth.routes';
import productRoutes from './products/product.routes';
import customerRoutes from './customers/customer.routes';
import quotationRoutes from './quotations/quotation.routes';
import discountRoutes from './discounts/discount.routes';
import approvalRoutes from './approvals/approval.routes';
import auditRoutes from './audit/audit.routes';
import userRoutes from './users/user.routes';

const app = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: config.CLIENT_URL,
  credentials: true,
}));
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});
app.use('/api/', limiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/quotations', quotationRoutes);
app.use('/api/discounts', discountRoutes);
app.use('/api/approvals', approvalRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/users', userRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';
  console.error(`[ERROR] ${statusCode}: ${message}`);
  res.status(statusCode).json({ error: message });
});

export default app;
