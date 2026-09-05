# Integration Contract — Developers 2 & 3

## How to Integrate

### 1. Getting a Quotation
```typescript
GET /api/quotations/:id
Headers: { Authorization: `Bearer ${token}` }

// Response includes:
// - quotation (with all fields)
// - lines[] (each includes product details)
// - customer (with tier)
// - salesRepresentative
// - approvalRequests[]
```

### 2. Creating a Quotation
```typescript
POST /api/quotations
Headers: { Authorization: `Bearer ${token}` }
Body: {
  customerId: string,    // required
  currency?: string,     // default "USD"
  notes?: string,
  validUntil?: string    // ISO date
}

// Returns quotation in DRAFT status
```

### 3. Adding Lines to a Quotation
```typescript
POST /api/quotations/:id/lines
Headers: { Authorization: `Bearer ${token}` }
Body: {
  productId: string,        // required
  quantity: number,         // required
  unitPrice: number,        // required
  unitCost: number,         // required
  discountPercent?: number, // default 0
  taxRate?: number,         // default 0
  billingType?: "ONE_TIME" | "RECURRING"
}

// Quotation totals are auto-recalculated after each line add/remove
```

### 4. Checking Discounts
```typescript
POST /api/quotations/:id/discount-check
Headers: { Authorization: `Bearer ${token}` }

// Returns:
{
  allowed: boolean,
  riskScore: number (0-100),
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  violations: [{
    productId, productName, requestedDiscount,
    allowedDiscount, excess, marginImpact, violation
  }],
  requiredApprovalLevel: string | null
}
```

### 5. Submitting for Approval
```typescript
POST /api/quotations/:id/submit
Headers: { Authorization: `Bearer ${token}` }

// Internal flow:
// 1. Runs discount check
// 2. If no violations → auto-approves (status = APPROVED)
// 3. If violations → creates ApprovalRequest (status = PENDING_APPROVAL)
// 4. Backend calculates the approval chain based on risk score

// Returns:
{
  autoApproved: boolean,
  approvalRequest?: { id, riskScore, riskLevel, currentStep, totalSteps, requiredRole },
  discountResult?: { ... }
}
```

### 6. Getting Customer Data
```typescript
GET /api/customers/:id
// Returns customer with tier and sales rep

GET /api/customers/tiers
// Returns all tiers with discount percentages
```

### 7. Getting Products
```typescript
GET /api/products
// Returns all products with category and variants

GET /api/products/:id
// Returns single product with details
```

### 8. Quotation Status Flow
```
DRAFT → PENDING_APPROVAL → APPROVED → CONVERTED
                  ↓            ↓
              REJECTED      CANCELLED
              RETURNED → DRAFT (can edit and resubmit)
```

### 9. Price Resolution
The backend supports three pricing sources:
1. **Base price** — `Product.basePrice`
2. **Price list price** — `PriceListItem.price` (filtered by customer tier)
3. **Tier discount** — `CustomerTier.discountPct`

Frontend should use the unitPrice from the price list when building quotations.

### 10. Billing Types
Lines support two billing types:
- `ONE_TIME` — Standard purchase
- `RECURRING` — Subscription billing (Developer 3)

### 11. Approval Chain Rules
The backend determines the approval chain:
- Risk 0: No approval needed
- Risk 1-59: SALES_MANAGER
- Risk 60-79: SALES_MANAGER → FINANCE
- Risk 80-100: SALES_MANAGER → FINANCE → ADMIN

The frontend must NOT decide the chain — it reads `requiredRole` from the approval request.

### 12. User Roles
| Role | Access |
|------|--------|
| ADMIN | Full access |
| SALES_REP | Customers, products, quotations, own sales workflow |
| SALES_MANAGER | Quotations, approvals, sales dashboard |
| FINANCE | Billing, invoices, payments, approval (where configured) |
| OPERATIONS | Fulfillment, warehouses, inventory |
| CUSTOMER | Only their own portal resources |

### 13. Models Available for Extension
The Prisma schema already includes these models for Developers 2 & 3:

**Developer 2 (Fulfillment):**
- `Warehouse`, `WarehouseStock`
- `FulfillmentOrder`, `FulfillmentLine`, `Backorder`
- `Negotiation`, `NegotiationMessage`, `ChangeRequest`
- `DealHealth`, `Alert`
- `SalesOrder`

**Developer 3 (Billing):**
- `SubscriptionPlan`, `Subscription`, `SubscriptionLine`
- `BillingSchedule`
- `Invoice`, `Payment`

**Shared:**
- `UpsellRule`, `CrossSellRule`, `Recommendation`

### 14. Key Quotation Calculations
```
lineSubtotal = quantity × unitPrice
discountAmount = lineSubtotal × discountPercent / 100
taxAmount = (lineSubtotal - discountAmount) × taxRate / 100
lineTotal = lineSubtotal - discountAmount + taxAmount
costTotal = quantity × unitCost
marginAmount = lineTotal - costTotal
marginPercentage = marginAmount / lineTotal × 100

Quotation totals aggregate all lines.
```

All calculations use `Decimal` for precision.

### 15. Discount Rules Structure
```
Tier Rules:
  BRONZE → max 5%
  SILVER → max 10%
  GOLD → max 15%

Category Rules:
  Hardware → max 15%
  Services → max 10%
  Software → max 12%
  Accessories → max 8%

The effective discount for a line is the MINIMUM of tier limit and category limit.
```

### 16. Running the Backend
```bash
cd backend
npm install
npx prisma generate
npx prisma db push --accept-data-loss
npm run seed
npm run dev
```

Server runs on `http://localhost:5000`.
