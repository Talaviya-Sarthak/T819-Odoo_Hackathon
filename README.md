# DealFlow360 - T819 

**An Intelligent, Self-Governing Sales Operations Platform**

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node.js](https://img.shields.io/badge/Node.js-18.x-green.svg)
![React](https://img.shields.io/badge/React-18.x-blue.svg)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15.x-blue.svg)

---

## Overview

DealFlow360 is a comprehensive B2B sales operations platform designed to handle the complexities of modern enterprise sales workflows. Unlike simple quote-to-invoice tools, DealFlow360 operates as a **self-governing deal engine** that enforces pricing discipline, reacts to inventory reality in real-time, keeps subscriptions and one-time sales reconciled on a single order, and provides both sales reps and customers with a living, negotiable document.

### The Problem We Solve

Most sales tools handle the basics well: create a quote, confirm an order, invoice it. Real B2B sales teams operate in messier conditions:

- Multi-level discount approvals across different product categories
- Partial stock spread across multiple warehouses
- Bundled subscriptions mixed with one-time hardware
- Customers who want to negotiate inside a portal instead of over email
- Managers who only find out a deal is stuck after it has already lost momentum

DealFlow360 addresses all these challenges in a single, unified platform.

---

## Core Features

### 1. Multi-Tier Discount Governance & Automated Approval Routing
- **Blended Risk Score Calculation**: Evaluates discount patterns across all order lines, not just individual items
- **Category-Specific Limits**: Hardware (15%), Services (10%), Subscriptions (5%) with customizable ceilings
- **Customer Tier Recognition**: Bronze (5%), Silver (10%), Gold (15%), Platinum (20%) discount allowances
- **Automatic Routing**: Quotes exceeding thresholds are routed to Sales Manager, then Finance if needed
- **Complete Audit Trail**: Every approval, rejection, and edit logged with user, timestamp, and reason

### 2. Live Upsell & Cross-Sell Recommendations
- **Real-Time Suggestions**: Based on historical co-purchase data and active promotions
- **Margin Impact Display**: See immediate effect on deal margins when adding suggestions
- **Promotion Tags**: Highlight currently promoted products for higher visibility
- **One-Click Addition**: Add suggestions directly to quote with instant cart updates

### 3. Multi-Warehouse Fulfillment & Backorder Handling
- **Intelligent Splitting**: Automatically splits orders across warehouses based on stock availability
- **Shipping Cost Optimization**: Minimizes number of shipments using configured cost weightings
- **Manual Override**: Sales reps can adjust warehouse allocation when needed
- **Backorder Consolidation**: Automatic prompts when stock arrives mid-fulfillment

### 4. Hybrid Billing (One-Time + Recurring)
- **Mixed Order Lines**: Support one-time products and recurring subscription lines on same order
- **Proration Engine**: Handles mid-cycle quantity or plan changes with automatic proration
- **Billing Schedules**: Clear visibility into upcoming charges for recurring items
- **Cancellation Handling**: Automatic partial refund or credit note generation when subscriptions are modified

### 5. Deal Health Monitoring & Anomaly Alerts
- **Stalled Deal Detection**: Alerts when quotations are inactive beyond configured thresholds
- **Discount Anomaly Detection**: Flags discounts significantly above rep's historical average
- **Delivery Slippage Indicators**: Tracks promise vs. actual delivery dates
- **One-Click Navigation**: Click alerts to open related quotations directly
- **Automated Nudges**: Trigger escalation actions from dashboard alerts

### 6. Customer-Facing Portal Negotiation
- **Separate Customer View**: Restricted, dedicated portal for external stakeholders
- **Live Quotation Status**: Real-time visibility into Sent, Under Negotiation, Confirmed states
- **Line-Level Communication**: Comment and change request tools per order line
- **Counter-Proposal System**: Customers can propose alternative discounts
- **Automatic Re-Approval**: If terms exceed thresholds, quote re-enters approval flow automatically

### 7. Sales Backend Configuration & Reporting
- **Product Management**: Name, category, price, unit, tax, variants, price lists
- **Warehouse Setup**: Create warehouses, configure stock levels, replenishment rules
- **Subscription Plans**: Monthly, quarterly, yearly with configurable proration rules
- **Reporting Dashboard**: Sales performance, deal health, approval status tracking
- **Export Options**: PDF and XLS export for reports

---

## User Roles

| Role | Responsibilities |
|------|------------------|
| **Sales Rep** | Build quotations, apply discounts, add upsell items, track approvals, respond to customer negotiations |
| **Sales Manager** | Review/approve/reject quotations exceeding thresholds, configure discount tiers, monitor deal health |
| **Finance/Operations** | Handle second-level approvals, manage warehouse fulfillment, reconcile billing |
| **Customer (Portal)** | View quotations, request changes, propose counter-discounts, confirm final terms |
| **Admin** | Manage backend setup (products, price lists, warehouses, plans), view analytics |

---

## Tech Stack

### Backend
| Component | Technology | Version |
|-----------|------------|---------|
| Runtime | Node.js | 18.x |
| Framework | Express.js | 4.18.2 |
| Language | JavaScript (CommonJS) | ES2022+ |
| Database | PostgreSQL | 15.x |
| ORM | Raw SQL via `pg` | 8.11.3 |
| Authentication | JWT + Passport.js | 9.0.2 / 0.7.0 |
| OAuth | Google, GitHub | - |
| Password Hashing | bcryptjs | 2.4.3 |
| Email | Nodemailer | 6.9.7 |
| Validation | Custom schemas | - |
| Logging | Pino | 8.16.2 |
| Security | Helmet, CORS, Rate Limiting | - |

### Frontend
| Component | Technology | Version |
|-----------|------------|---------|
| Framework | React | 18.2.0 |
| Language | TypeScript | 5.3.2 |
| Build Tool | Vite | 5.0.0 |
| CSS | TailwindCSS | 4.0.0 |
| Routing | React Router DOM | 6.20.1 |
| HTTP Client | Native Fetch API | - |

### Infrastructure
- **Database**: PostgreSQL (local or Supabase-hosted)
- **Authentication**: JWT with access/refresh token rotation
- **OAuth**: Google & GitHub integration
- **Email**: SMTP via Nodemailer

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                              │
├─────────────────────────────────────────────────────────────────┤
│  React SPA (Vite + TypeScript + TailwindCSS)                    │
│  ├── Auth Pages (Login, Register, OTP, Password Reset)          │
│  ├── Dashboard (Protected)                                      │
│  ├── Sales Workspace (Quotations, Pipeline)                     │
│  ├── Quotation Builder (Products, Cart, Upsells)                │
│  ├── Approval Workflow                                          │
│  ├── Fulfillment & Warehouse Split                              │
│  ├── Subscription & Billing                                     │
│  ├── Customer Portal                                            │
│  └── Deal Health Dashboard                                      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        API LAYER                                 │
├─────────────────────────────────────────────────────────────────┤
│  Express.js REST API (Port 5000)                                │
│  ├── Authentication (JWT, OAuth, OTP)                           │
│  ├── Products & Price Lists                                     │
│  ├── Quotations & Orders                                        │
│  ├── Discount Governance & Approval Routing                     │
│  ├── Warehouse & Fulfillment                                    │
│  ├── Subscriptions & Billing                                    │
│  ├── Customer Portal                                            │
│  └── Analytics & Reporting                                      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       DATA LAYER                                 │
├─────────────────────────────────────────────────────────────────┤
│  PostgreSQL Database                                            │
│  ├── users (Authentication)                                     │
│  ├── products & price_lists                                     │
│  ├── quotations & quotation_lines                               │
│  ├── warehouses & inventory                                     │
│  ├── subscriptions & billing_schedules                          │
│  ├── approvals & audit_trail                                    │
│  └── analytics & alerts                                         │
└─────────────────────────────────────────────────────────────────┘
```

### Layered Architecture Pattern

```
Routes → Controller → Service → Repository → Database
   │         │           │          │            │
   │         │           │          │            └── Raw SQL queries
   │         │           │          └── Data access layer
   │         │           └── Business logic
   │         └── Request/Response handling
   └── HTTP endpoint definitions
```

---

## Data Model

### Core Tables

#### Users & Authentication
```sql
-- User accounts
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    password_hash VARCHAR(255),
    role VARCHAR(50) DEFAULT 'sales_rep',
    customer_tier VARCHAR(50) DEFAULT 'bronze',
    avatar_url TEXT,
    email_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- OAuth accounts
CREATE TABLE oauth_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL,
    provider_user_id VARCHAR(255) NOT NULL,
    UNIQUE(provider, provider_user_id)
);
```

#### Products & Pricing
```sql
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT,
    base_price DECIMAL(10,2) NOT NULL,
    unit VARCHAR(50),
    tax_rate DECIMAL(5,2) DEFAULT 0,
    is_subscription BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE product_variants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id),
    attribute VARCHAR(100),
    value VARCHAR(100),
    extra_price DECIMAL(10,2) DEFAULT 0
);

CREATE TABLE price_lists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    customer_tier VARCHAR(50),
    currency VARCHAR(3) DEFAULT 'USD',
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE price_list_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    price_list_id UUID REFERENCES price_lists(id),
    product_id UUID REFERENCES products(id),
    price DECIMAL(10,2) NOT NULL
);
```

#### Quotations & Orders
```sql
CREATE TABLE quotations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES users(id),
    sales_rep_id UUID REFERENCES users(id),
    status VARCHAR(50) DEFAULT 'draft',
    blended_risk_score DECIMAL(5,2),
    total_amount DECIMAL(12,2),
    currency VARCHAR(3) DEFAULT 'USD',
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE quotation_lines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quotation_id UUID REFERENCES quotations(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    variant_id UUID REFERENCES product_variants(id),
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2),
    discount_percent DECIMAL(5,2) DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    line_total DECIMAL(12,2),
    is_recurring BOOLEAN DEFAULT FALSE,
    billing_cycle VARCHAR(50)
);
```

#### Warehouse & Fulfillment
```sql
CREATE TABLE warehouses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    shipping_cost_weight DECIMAL(5,2) DEFAULT 1.0,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    warehouse_id UUID REFERENCES warehouses(id),
    product_id UUID REFERENCES products(id),
    variant_id UUID REFERENCES product_variants(id),
    quantity INTEGER DEFAULT 0,
    reorder_point INTEGER DEFAULT 10
);

CREATE TABLE fulfillment_splits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id),
    warehouse_id UUID REFERENCES warehouses(id),
    quantity_fulfilled INTEGER,
    estimated_shipment_cost DECIMAL(10,2),
    status VARCHAR(50) DEFAULT 'pending'
);
```

#### Approvals & Audit Trail
```sql
CREATE TABLE discount_tiers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_tier VARCHAR(50) NOT NULL,
    category VARCHAR(100),
    max_discount_percent DECIMAL(5,2) NOT NULL,
    requires_manager_approval BOOLEAN DEFAULT FALSE,
    requires_finance_approval BOOLEAN DEFAULT FALSE
);

CREATE TABLE approvals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quotation_id UUID REFERENCES quotations(id),
    approver_id UUID REFERENCES users(id),
    approval_level VARCHAR(50),
    status VARCHAR(50) DEFAULT 'pending',
    comments TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE audit_trail (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_type VARCHAR(100),
    entity_id UUID,
    action VARCHAR(100),
    user_id UUID REFERENCES users(id),
    details JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);
```

#### Subscriptions & Billing
```sql
CREATE TABLE subscription_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    billing_cycle VARCHAR(50) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    proration_rule VARCHAR(50) DEFAULT 'daily'
);

CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id),
    plan_id UUID REFERENCES subscription_plans(id),
    status VARCHAR(50) DEFAULT 'active',
    start_date DATE,
    next_billing_date DATE,
    quantity INTEGER DEFAULT 1
);

CREATE TABLE billing_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subscription_id UUID REFERENCES subscriptions(id),
    billing_date DATE,
    amount DECIMAL(10,2),
    status VARCHAR(50) DEFAULT 'pending'
);
```

---

## Project Structure

```
DealFlow360/
├── backend/
│   ├── src/
│   │   ├── server.js                    # Entry point
│   │   ├── app.js                       # Express app config
│   │   ├── config/
│   │   │   └── env.js                   # Environment variables
│   │   ├── database/
│   │   │   ├── index.js                 # PostgreSQL connection
│   │   │   └── providers/
│   │   │       └── schema.sql           # Database schema
│   │   ├── middlewares/
│   │   │   ├── auth.middleware.js        # JWT verification
│   │   │   ├── error.middleware.js       # Error handling
│   │   │   ├── rate-limit.middleware.js  # Rate limiting
│   │   │   └── request.middleware.js     # Request logging
│   │   ├── modules/
│   │   │   ├── auth/                    # Authentication module
│   │   │   │   ├── auth.routes.js
│   │   │   │   ├── auth.controller.js
│   │   │   │   ├── auth.service.js
│   │   │   │   ├── auth.validation.js
│   │   │   │   ├── email/
│   │   │   │   │   └── otp.service.js
│   │   │   │   ├── jwt/
│   │   │   │   │   └── jwt.service.js
│   │   │   │   └── oauth/
│   │   │   │       ├── google/
│   │   │   │       │   └── strategy.js
│   │   │   │       └── github/
│   │   │   │           └── strategy.js
│   │   │   ├── products/                # Product management (planned)
│   │   │   ├── quotations/              # Quotation builder (planned)
│   │   │   ├── approvals/               # Approval workflow (planned)
│   │   │   ├── warehouses/              # Warehouse management (planned)
│   │   │   ├── subscriptions/           # Subscription billing (planned)
│   │   │   └── analytics/               # Reporting (planned)
│   │   ├── repositories/
│   │   │   └── user.repository.js       # User data access
│   │   ├── services/
│   │   │   └── email/
│   │   │       └── email.service.js     # Email sending
│   │   └── utils/
│   │       ├── errors.js                # Custom error class
│   │       ├── logger.js                # Logging utility
│   │       └── response.js              # Response helpers
│   ├── schema.sql                       # Root schema file
│   ├── .env.example                     # Environment template
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── main.tsx                     # React entry point
│   │   ├── App.tsx                      # Router setup
│   │   ├── index.css                    # TailwindCSS imports
│   │   ├── types/
│   │   │   └── index.ts                 # TypeScript interfaces
│   │   ├── context/
│   │   │   └── AuthContext.tsx           # Auth state management
│   │   ├── services/
│   │   │   └── auth.api.ts              # Auth API client
│   │   ├── routes/
│   │   │   └── ProtectedRoute.tsx       # Auth guard
│   │   ├── components/
│   │   │   ├── AuthLayout.tsx           # Auth page wrapper
│   │   │   ├── Button.tsx              # Reusable button
│   │   │   ├── Input.tsx               # Reusable input
│   │   │   └── OAuthButton.tsx         # OAuth buttons
│   │   ├── auth/
│   │   │   ├── Login.tsx               # Login page
│   │   │   ├── Register.tsx            # Registration page
│   │   │   ├── VerifyOTP.tsx           # OTP verification
│   │   │   ├── ForgotPassword.tsx      # Password reset request
│   │   │   ├── ResetPassword.tsx       # Password reset form
│   │   │   └── Callback.tsx            # OAuth callback handler
│   │   └── pages/
│   │       ├── Dashboard.tsx           # Main dashboard
│   │       ├── SalesWorkspace.tsx      # Sales workspace (planned)
│   │       ├── QuotationBuilder.tsx    # Quote builder (planned)
│   │       ├── CustomerPortal.tsx      # Customer portal (planned)
│   │       └── AdminPanel.tsx          # Admin configuration (planned)
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── package.json
├── docs/
│   ├── architecture.md                  # Architecture documentation
│   ├── api-reference.md                 # API documentation
│   └── deployment.md                    # Deployment guide
├── scripts/
│   └── seed.sql                         # Sample seed data
├── README.md                            # This file
└── LICENSE
```

---

## Getting Started

### Prerequisites

- **Node.js** 18.x or higher
- **PostgreSQL** 15.x or higher
- **npm** 9.x or higher
- **Git**

### Installation

#### 1. Clone the Repository
```bash
git clone https://github.com/your-team/dealflow360.git
cd dealflow360
```

#### 2. Backend Setup
```bash
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Configure environment variables (see Environment Variables section)
# Edit .env with your database credentials, JWT secrets, etc.

# Initialize database
psql -U postgres -d your_database -f schema.sql

# Seed sample data (optional)
psql -U postgres -d your_database -f ../scripts/seed.sql

# Start development server
npm run dev
```

Backend runs on `http://localhost:5000`

#### 3. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Configure API URL
# Edit .env and set VITE_API_URL=http://localhost:5000

# Start development server
npm run dev
```

Frontend runs on `http://localhost:5173`

### Quick Start with Skip Email Mode

For development, you can bypass email verification:

```bash
# In backend/.env
EMAIL_PROVIDER=skip
```

This allows immediate login after registration without OTP verification.

---

## Environment Variables

### Backend (.env)

#### Database
```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/dealflow360
```

#### JWT Authentication
```env
JWT_ACCESS_SECRET=your-access-secret-key-min-32-chars
JWT_REFRESH_SECRET=your-refresh-secret-key-min-32-chars
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d
```

#### Email (SMTP)
```env
EMAIL_PROVIDER=smtp  # Options: smtp, skip
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@dealflow360.com
```

#### OAuth - Google
```env
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
```

#### OAuth - GitHub
```env
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
GITHUB_CALLBACK_URL=http://localhost:5000/api/auth/github/callback
```

#### Application
```env
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:5173
```

#### Rate Limiting
```env
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100
```

### Frontend (.env)

```env
VITE_API_URL=http://localhost:5000
```

---

## API Reference

### Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register` | Register new user | No |
| POST | `/api/auth/verify-email` | Verify email with OTP | No |
| POST | `/api/auth/resend-otp` | Resend verification OTP | No |
| POST | `/api/auth/login` | Login with credentials | No |
| POST | `/api/auth/refresh` | Refresh access token | No |
| POST | `/api/auth/logout` | Logout (clear refresh token) | Yes |
| GET | `/api/auth/me` | Get current user profile | Yes |
| POST | `/api/auth/forgot-password` | Request password reset | No |
| POST | `/api/auth/reset-password` | Reset password with token | No |
| GET | `/api/auth/google` | Google OAuth login | No |
| GET | `/api/auth/google/callback` | Google OAuth callback | No |
| GET | `/api/auth/github` | GitHub OAuth login | No |
| GET | `/api/auth/github/callback` | GitHub OAuth callback | No |

### Health Check
```bash
GET /api/health
# Response: { "status": "ok", "timestamp": "2024-01-01T00:00:00.000Z" }
```

### Request/Response Examples

#### Register User
```bash
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "name": "John Doe"
}

# Response (201)
{
  "success": true,
  "message": "Registration successful. Please verify your email.",
  "data": {
    "user": {
      "id": "uuid-here",
      "email": "user@example.com",
      "name": "John Doe",
      "email_verified": false
    }
  }
}
```

#### Login
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!"
}

# Response (200)
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid-here",
      "email": "user@example.com",
      "name": "John Doe",
      "email_verified": true
    },
    "accessToken": "jwt-access-token",
    "refreshToken": "jwt-refresh-token"
  }
}
```

#### Get Current User
```bash
GET /api/auth/me
Authorization: Bearer <access-token>

# Response (200)
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid-here",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "sales_rep",
      "customer_tier": "gold",
      "email_verified": true
    }
  }
}
```

---

## Business Logic

### Blended Discount Risk Score

The risk score determines approval requirements by evaluating discount patterns across all order lines:

```javascript
// Example calculation
const orderLines = [
  { product: 'Laptop', category: 'hardware', discount: 12, maxAllowed: 15 },
  { product: 'Setup Service', category: 'services', discount: 18, maxAllowed: 10 }
];

// Line 1: 12% discount, 15% allowed → 3 points under limit (OK)
// Line 2: 18% discount, 10% allowed → 8 points over limit (FLAGGED)

// Blended Risk Score = Average deviation across all lines
// = (3 + (-8)) / 2 = -2.5 (negative = over limit)
```

**Routing Logic:**
- Score > 0: No approval needed
- Score 0 to -5: Sales Manager approval
- Score < -5: Sales Manager + Finance approval

### Approval Workflow

```
Quotation Created
       │
       ▼
┌─────────────────┐
│ Calculate Risk  │
│ Score           │
└────────┬────────┘
         │
         ▼
    ┌────────────┐
    │ Score > 0? │
    └─────┬──────┘
          │
    ┌─────┴─────┐
    │           │
   Yes         No
    │           │
    ▼           ▼
┌────────┐  ┌────────────────┐
│ Auto-  │  │ Route to       │
│ Approve│  │ Sales Manager  │
└────────┘  └───────┬────────┘
                    │
              ┌─────┴─────┐
              │           │
          Approved    Rejected
              │           │
              ▼           ▼
         ┌─────────┐  ┌──────────┐
         │ Check   │  │ Return   │
         │ Finance │  │ to Rep   │
         │ Needed? │  └──────────┘
         └────┬────┘
              │
        ┌─────┴─────┐
        │           │
       Yes         No
        │           │
        ▼           ▼
   ┌─────────┐  ┌─────────┐
   │ Finance │  │ Approved│
   │ Review  │  └─────────┘
   └────┬────┘
        │
  ┌─────┴─────┐
  │           │
Approved   Rejected
  │           │
  ▼           ▼
┌────────┐ ┌──────────┐
│Approved│ │Return to │
└────────┘ │Rep       │
           └──────────┘
```

### Warehouse Fulfillment Split Algorithm

```javascript
function calculateWarehouseSplit(order, warehouses) {
  const splits = [];
  let remainingQty = order.quantity;
  
  // Sort warehouses by shipping cost weight (lowest first)
  const sortedWarehouses = warehouses
    .filter(w => w.stock >= order.minQty)
    .sort((a, b) => a.shippingCostWeight - b.shippingCostWeight);
  
  for (const warehouse of sortedWarehouses) {
    if (remainingQty <= 0) break;
    
    const fulfillQty = Math.min(remainingQty, warehouse.stock);
    splits.push({
      warehouse: warehouse.name,
      quantity: fulfillQty,
      estimatedCost: fulfillQty * warehouse.shippingCostWeight
    });
    
    remainingQty -= fulfillQty;
  }
  
  // If stock unavailable, create backorder
  if (remainingQty > 0) {
    splits.push({
      warehouse: 'BACKORDER',
      quantity: remainingQty,
      estimatedCost: 0,
      status: 'backorder'
    });
  }
  
  return splits;
}
```

### Subscription Proration

For mid-cycle changes, proration is calculated based on remaining days:

```javascript
function calculateProration(subscription, changeDate) {
  const cycleStart = subscription.lastBillingDate;
  const cycleEnd = subscription.nextBillingDate;
  const totalDays = (cycleEnd - cycleStart) / (1000 * 60 * 60 * 24);
  const daysUsed = (changeDate - cycleStart) / (1000 * 60 * 60 * 24);
  const daysRemaining = totalDays - daysUsed;
  
  const prorationFactor = daysRemaining / totalDays;
  const refundAmount = subscription.quantity * subscription.price * prorationFactor;
  
  return {
    refundAmount,
    prorationFactor,
    daysRemaining,
    totalDays
  };
}
```

---

## Seed Data

The `scripts/seed.sql` file provides sample data for testing:

### Sample Products
| Product | Category | Base Price | Tax Rate |
|---------|----------|------------|----------|
| Business Laptop Pro | Hardware | $1,299.99 | 8.25% |
| Wireless Mouse | Hardware | $29.99 | 8.25% |
| 27" 4K Monitor | Hardware | $449.99 | 8.25% |
| Setup Service | Services | $199.99 | 0% |
| Installation Package | Services | $399.99 | 0% |
| Cloud Backup (Monthly) | Subscriptions | $19.99/mo | 0% |
| Premium Support (Monthly) | Subscriptions | $49.99/mo | 0% |

### Sample Discount Tiers
| Customer Tier | Max Discount | Manager Approval | Finance Approval |
|---------------|--------------|------------------|------------------|
| Bronze | 5% | No | No |
| Silver | 10% | Yes (>8%) | No |
| Gold | 15% | Yes (>12%) | Yes (>15%) |
| Platinum | 20% | Yes (>15%) | Yes (>18%) |

### Sample Warehouses
| Warehouse | Location | Shipping Weight |
|-----------|----------|-----------------|
| Main Warehouse | New York, NY | 1.0 |
| East Depot | Boston, MA | 1.2 |
| West Coast Hub | Los Angeles, CA | 1.5 |

---

## Testing

### Backend Tests
```bash
cd backend

# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test suite
npm run test:auth
```

### Frontend Tests
```bash
cd frontend

# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch
```

### API Testing with cURL
```bash
# Health check
curl http://localhost:5000/api/health

# Register user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!","name":"Test User"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!"}'

# Get profile (replace <token> with actual JWT)
curl http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer <token>"
```

---

## Deployment

### Docker (Recommended)

```dockerfile
# backend/Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 5000

CMD ["node", "src/server.js"]
```

```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: dealflow360
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  backend:
    build: ./backend
    ports:
      - "5000:5000"
    environment:
      DATABASE_URL: postgresql://postgres:password@postgres:5432/dealflow360
      JWT_ACCESS_SECRET: your-secret-key
      JWT_REFRESH_SECRET: your-refresh-secret
    depends_on:
      - postgres

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  postgres_data:
```

### Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Use strong JWT secrets (32+ characters)
- [ ] Configure proper SMTP settings
- [ ] Set up SSL/TLS certificates
- [ ] Configure CORS for production domain
- [ ] Set up database backups
- [ ] Configure rate limiting for production traffic
- [ ] Set up monitoring and logging
- [ ] Configure OAuth callbacks for production URLs

---

## Contributing

### Branch Strategy

```
main (production)
├── develop (integration)
│   ├── feature/auth
│   ├── feature/quotations
│   └── feature/approvals
├── hotfix/critical-bug
└── release/v1.0.0
```

### Commit Convention

```
feat: add quotation builder component
fix: resolve discount calculation bug
docs: update API documentation
refactor: improve warehouse split algorithm
test: add unit tests for auth service
```

### Pull Request Process

1. Create feature branch from `develop`
2. Implement changes with tests
3. Update documentation if needed
4. Submit PR with detailed description
5. Request review from team members
6. Address feedback and merge

---

## Roadmap

### Phase 1: Core Authentication (Completed)
- [x] User registration with email verification
- [x] Login with email/password
- [x] JWT token management with refresh
- [x] OAuth integration (Google, GitHub)
- [x] Password reset flow
- [x] Rate limiting and security

### Phase 2: Product & Price Management (In Progress)
- [ ] Product CRUD operations
- [ ] Product variants management
- [ ] Price list configuration
- [ ] Category management

### Phase 3: Quotation Builder (Planned)
- [ ] Quotation creation interface
- [ ] Product selection with search
- [ ] Line item management
- [ ] Discount application
- [ ] Real-time margin calculation

### Phase 4: Approval Workflow (Planned)
- [ ] Blended risk score engine
- [ ] Automatic routing logic
- [ ] Approval interface
- [ ] Notification system
- [ ] Audit trail

### Phase 5: Warehouse & Fulfillment (Planned)
- [ ] Warehouse management
- [ ] Inventory tracking
- [ ] Auto-split algorithm
- [ ] Backorder handling
- [ ] Shipping cost optimization

### Phase 6: Subscription Billing (Planned)
- [ ] Subscription plan management
- [ ] Billing schedule generation
- [ ] Proration engine
- [ ] Cancellation handling
- [ ] Credit note generation

### Phase 7: Customer Portal (Planned)
- [ ] Customer authentication
- [ ] Quotation viewer
- [ ] Negotiation interface
- [ ] Counter-proposal system

### Phase 8: Analytics & Reporting (Planned)
- [ ] Deal health dashboard
- [ ] Anomaly detection
- [ ] Sales performance reports
- [ ] Export functionality

### Future Enhancements
- [ ] Multi-currency support
- [ ] Multi-company support
- [ ] AI-powered upsell recommendations
- [ ] Mobile application
- [ ] Integration with ERP systems
- [ ] Advanced analytics with ML

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Support

For support and questions:
- **Documentation**: [docs/dealflow360.com](https://docs.dealflow360.com)
- **Issues**: [GitHub Issues](https://github.com/your-team/dealflow360/issues)
- **Email**: support@dealflow360.com

---

## Acknowledgments

- Built for Odoo Hackathon 2026
- Inspired by real-world B2B sales operations challenges
- Designed with production-ready architecture patterns
