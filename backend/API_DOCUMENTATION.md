# DealFlow360 Backend API Documentation

## Base URL
```
http://localhost:5000
```

## Authentication
All protected endpoints require a JWT token in the header:
```
Authorization: Bearer <accessToken>
```

## Response Format
```json
{
  "success": true,
  "message": "...",
  "data": { ... }
}
```
Error:
```json
{
  "error": "Error message"
}
```

---

## 1. AUTH

### POST /api/auth/login
Login with email and password.

**Request:**
```json
{
  "email": "rep@dealflow.com",
  "password": "demo1234"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "accessToken": "eyJ...",
    "refreshToken": "eyJ...",
    "user": {
      "id": "uuid",
      "email": "rep@dealflow.com",
      "name": "Sales Rep",
      "role": "SALES_REP",
      "status": "active",
      "avatarUrl": null,
      "emailVerified": true
    }
  }
}
```

### POST /api/auth/refresh
Refresh an expired access token.

**Request:**
```json
{
  "refreshToken": "eyJ..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJ...",
    "refreshToken": "eyJ..."
  }
}
```

### GET /api/auth/me
Get current authenticated user.

**Auth:** Required  
**Roles:** Any authenticated user

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "rep@dealflow.com",
      "name": "Sales Rep",
      "role": "SALES_REP"
    }
  }
}
```

---

## 2. USERS

### GET /api/users
List all users.

**Auth:** Required  
**Roles:** Any authenticated user

**Response:**
```json
{
  "success": true,
  "data": {
    "users": [
      { "id": "uuid", "email": "...", "name": "...", "role": "SALES_REP", "status": "active" }
    ]
  }
}
```

### GET /api/users/:id
Get a user by ID.

**Auth:** Required

---

## 3. PRODUCTS

### GET /api/products
List all active products.

**Auth:** Required  
**Query params:** `categoryId` (optional filter)

**Response:**
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "id": "uuid",
        "name": "Laptop",
        "sku": "HW-LAPTOP-001",
        "basePrice": 1200,
        "costPrice": 800,
        "taxRate": 18,
        "categoryId": "uuid",
        "category": { "id": "uuid", "name": "Hardware" },
        "variants": [],
        "active": true
      }
    ]
  }
}
```

### GET /api/products/:id
Get a single product with category and variants.

### GET /api/products/categories
List all product categories.

**Response:**
```json
{
  "success": true,
  "data": {
    "categories": [
      { "id": "uuid", "name": "Hardware", "description": "..." },
      { "id": "uuid", "name": "Services" }
    ]
  }
}
```

---

## 4. CUSTOMERS

### GET /api/customers
List all customers with tier and sales rep info.

### GET /api/customers/:id
Get a single customer.

### POST /api/customers
Create a new customer.

**Request:**
```json
{
  "name": "Acme Corp",
  "company": "Acme Corporation",
  "email": "contact@acme.com",
  "phone": "+1-555-0101",
  "address": "123 Main St",
  "currency": "USD",
  "tierId": "uuid-of-gold-tier",
  "salesRepId": "uuid-of-sales-rep"
}
```

### GET /api/customers/tiers
List all customer tiers.

**Response:**
```json
{
  "success": true,
  "data": {
    "tiers": [
      { "id": "uuid", "name": "BRONZE", "discountPct": 5 },
      { "id": "uuid", "name": "SILVER", "discountPct": 10 },
      { "id": "uuid", "name": "GOLD", "discountPct": 15 }
    ]
  }
}
```

---

## 5. QUOTATIONS

### GET /api/quotations
List quotations. Supports filters.

**Query params:** `status`, `salesRepId`, `customerId` (all optional)

**Response:**
```json
{
  "success": true,
  "data": {
    "quotations": [
      {
        "id": "uuid",
        "quotationNumber": "Q-1001",
        "status": "DRAFT",
        "subtotal": 11450,
        "discountAmount": 1401,
        "taxAmount": 1792.94,
        "totalAmount": 12143.94,
        "totalCost": 8200,
        "grossMargin": 3943.94,
        "marginPercentage": 32.47,
        "customer": { "id": "uuid", "name": "Acme Corp", "tier": { "name": "GOLD" } },
        "salesRepresentative": { "id": "uuid", "name": "Sales Rep" },
        "lines": [
          {
            "id": "uuid",
            "product": { "name": "Laptop", "sku": "HW-LAPTOP-001" },
            "quantity": 10,
            "unitPrice": 1100,
            "unitCost": 800,
            "discountPercent": 12,
            "discountAmount": 1320,
            "lineSubtotal": 11000,
            "lineTotal": 11702.4,
            "marginAmount": 3702.4,
            "billingType": "ONE_TIME"
          }
        ]
      }
    ]
  }
}
```

### GET /api/quotations/:id
Get a single quotation with lines, customer, sales rep, and approval requests.

### POST /api/quotations
Create a new quotation (DRAFT status).

**Request:**
```json
{
  "customerId": "uuid",
  "currency": "USD",
  "notes": "Optional notes",
  "validUntil": "2026-12-31"
}
```

### PUT /api/quotations/:id
Update quotation notes or validUntil. Status transitions are validated by state machine.

**Request:**
```json
{
  "notes": "Updated notes",
  "validUntil": "2026-12-31"
}
```

**State machine:**  
DRAFT → PENDING_APPROVAL, CANCELLED  
PENDING_APPROVAL → APPROVED, REJECTED, RETURNED, CANCELLED  
APPROVED → CONVERTED, CANCELLED  
REJECTED → DRAFT, CANCELLED  
RETURNED → DRAFT, PENDING_APPROVAL  
CONVERTED → (terminal)  
CANCELLED → DRAFT  

### POST /api/quotations/:id/lines
Add a line to a DRAFT or RETURNED quotation. Auto-recalculates totals.

**Request:**
```json
{
  "productId": "uuid",
  "quantity": 10,
  "unitPrice": 1100,
  "unitCost": 800,
  "discountPercent": 12,
  "taxRate": 18,
  "billingType": "ONE_TIME"
}
```

**billingType:** `ONE_TIME` or `RECURRING`

### DELETE /api/quotations/:id/lines/:lineId
Remove a line from a quotation. Auto-recalculates totals.

### POST /api/quotations/:id/discount-check
Check all lines against discount rules. Returns blended risk score.

**Response:**
```json
{
  "success": true,
  "data": {
    "allowed": false,
    "riskScore": 55,
    "riskLevel": "HIGH",
    "violations": [
      {
        "productId": "uuid",
        "productName": "Office Setup Service",
        "requestedDiscount": 18,
        "allowedDiscount": 10,
        "excess": 8,
        "marginImpact": "241.54",
        "violation": true
      }
    ],
    "requiredApprovalLevel": "SALES_MANAGER"
  }
}
```

**Risk levels:** `LOW` (0-24), `MEDIUM` (25-49), `HIGH` (50-74), `CRITICAL` (75-100)

### POST /api/quotations/:id/submit
Submit quotation for approval. Runs discount check internally.

**Response (approval required):**
```json
{
  "success": true,
  "data": {
    "autoApproved": false,
    "approvalRequest": {
      "id": "uuid",
      "riskScore": 55,
      "riskLevel": "HIGH",
      "currentStep": 1,
      "totalSteps": 1,
      "requiredRole": "SALES_MANAGER"
    },
    "discountResult": { ... }
  }
}
```

**Response (no violations):**
```json
{
  "success": true,
  "data": {
    "autoApproved": true,
    "quotation": { ... }
  }
}
```

---

## 6. DISCOUNTS

### GET /api/discounts/rules
List all active discount rules.

**Response:**
```json
{
  "success": true,
  "data": {
    "rules": [
      {
        "id": "uuid",
        "name": "Gold Tier Max Discount",
        "type": "TIER",
        "maxDiscountPct": 15,
        "customerTier": { "name": "GOLD" },
        "category": null
      },
      {
        "id": "uuid",
        "name": "Services Max Discount",
        "type": "CATEGORY",
        "maxDiscountPct": 10,
        "customerTier": null,
        "category": { "name": "Services" }
      }
    ]
  }
}
```

---

## 7. APPROVALS

### GET /api/approvals/pending
Get pending approval requests for the current user's role.

**Auth:** Required (role-based filtering)

### POST /api/approvals/:id/approve
Approve the current step of an approval request.

**Request:**
```json
{
  "notes": "Approved - acceptable risk"
}
```

**Multi-step logic:**  
- If more steps remain, advances to next step  
- If all steps complete, quotation status → APPROVED  
- Verifies: request is PENDING, user has correct role for current step

### POST /api/approvals/:id/reject
Reject an approval request. Quotation status → REJECTED.

### POST /api/approvals/:id/return
Return an approval request for revision. Quotation status → RETURNED.

---

## 8. AUDIT

### GET /api/audit
List audit logs with optional filters.

**Query params:** `entityType`, `entityId`, `userId`, `limit`, `offset` (all optional)

**Response:**
```json
{
  "success": true,
  "data": {
    "logs": [
      {
        "id": "uuid",
        "action": "approval_approved",
        "entityType": "approval_request",
        "entityId": "uuid",
        "createdAt": "2026-09-05T05:59:24.771Z",
        "user": { "name": "Sales Manager" }
      }
    ],
    "total": 12
  }
}
```

---

## 9. HEALTH

### GET /api/health
Check server health.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-09-05T06:05:19.170Z"
}
```

---

## Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| ADMIN | admin@dealflow.com | demo1234 |
| SALES_REP | rep@dealflow.com | demo1234 |
| SALES_MANAGER | manager@dealflow.com | demo1234 |
| FINANCE | finance@dealflow.com | demo1234 |
| OPERATIONS | ops@dealflow.com | demo1234 |
| CUSTOMER | customer@dealflow.com | demo1234 |
