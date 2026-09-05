# DealFlow360 REST API Specification & Integration Contract

**Author**: Developer 1 (Core Backend, Database & Quotations)  
**Consumers**: Developer 2 (Frontend UI), Developer 3 (Operations, Fulfillment & Invoicing)  
**Base URL**: `http://localhost:5000/api`  
**Authentication**: Bearer Token via HTTP Header: `Authorization: Bearer <access_token>`

---

## 1. Authentication & Common Conventions

### Standard Success Response Envelope
All successful responses follow this JSON structure:
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Resource fetched successfully",
  "data": { ... }
}
```

### Standard Error Response Envelope
```json
{
  "success": false,
  "error": "Error description message"
}
```

### Supported Roles
* `ADMIN` - Full administrative access across all modules
* `SALES_REP` - Manages quotations and deals for assigned customers
* `SALES_MANAGER` - Tier 1 approval, pricing and governance rules
* `FINANCE` - Tier 2 high-risk approval, invoicing and billing
* `OPERATIONS` - Fulfillment, warehouse management, inventory
* `CUSTOMER` - Customer portal access for self-service quotes and confirmations

### Demo Credentials (Password for all: `demo1234`)
| Role | Email |
|---|---|
| `ADMIN` | `admin@dealflow360.com` |
| `SALES_REP` | `sales@dealflow360.com` |
| `SALES_MANAGER` | `manager@dealflow360.com` |
| `FINANCE` | `finance@dealflow360.com` |
| `OPERATIONS` | `ops@dealflow360.com` |
| `CUSTOMER` | `customer@dealflow360.com` |

---

## 2. Authentication API (`/api/auth`)

### `POST /api/auth/login`
Authenticate user with email and password.
* **Access**: Public
* **Request Body**:
```json
{
  "email": "manager@dealflow360.com",
  "password": "demo1234"
}
```
* **Response**:
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOi...",
    "refreshToken": "eyJhbGciOi...",
    "user": {
      "id": "u-uuid-1",
      "email": "manager@dealflow360.com",
      "name": "Mike Sales Manager",
      "role": "SALES_MANAGER"
    }
  }
}
```

### `GET /api/auth/me`
Fetch current authenticated user profile and authorizations.
* **Access**: Authenticated

---

## 3. Product Management API (`/api/products`)

### `GET /api/products`
List all active products with category information and active variants.
* **Access**: Authenticated (All roles)
* **Query Parameters**:
  * `categoryId` (optional): Filter by category UUID
  * `search` (optional): Search by name, SKU, or description
  * `active` (optional): `true` / `false`
* **Response `data`**:
```json
{
  "products": [
    {
      "id": "p-uuid-1",
      "name": "Laptop",
      "sku": "HW-LAPTOP-001",
      "description": "Dell Latitude 15\" Core i7 32GB RAM",
      "unit": "unit",
      "basePrice": "1200.00",
      "costPrice": "800.00",
      "taxRate": "18.00",
      "categoryId": "cat-uuid-1",
      "active": true,
      "category": {
        "id": "cat-uuid-1",
        "name": "Hardware"
      },
      "variants": []
    }
  ]
}
```

### `GET /api/products/:id`
Get single product details with full category, variants, and pricing.
* **Access**: Authenticated (All roles)

### `POST /api/products`
Create a new product.
* **Access**: `ADMIN`, `SALES_MANAGER`, `OPERATIONS`
* **Request Body**:
```json
{
  "name": "Ultra-Wide Monitor",
  "sku": "HW-MON-UW-01",
  "description": "34-inch curved ultra-wide monitor",
  "unit": "unit",
  "basePrice": 650.00,
  "costPrice": 420.00,
  "taxRate": 18.00,
  "categoryId": "cat-uuid-1",
  "active": true
}
```

### `PUT /api/products/:id`
Update existing product.
* **Access**: `ADMIN`, `SALES_MANAGER`, `OPERATIONS`

### `GET /api/products/categories`
List all active categories with product counts.
* **Access**: Authenticated (All roles)

---

## 4. Customer Management API (`/api/customers`)

### `GET /api/customers`
List customers.
* **Access**:
  * `ADMIN`, `SALES_MANAGER`, `FINANCE`, `OPERATIONS`: All customers
  * `SALES_REP`: Assigned customers only
  * `CUSTOMER`: Current customer record only (ID tampering is impossible)
* **Response `data`**:
```json
{
  "customers": [
    {
      "id": "cust-uuid-1",
      "name": "Acme Corp",
      "company": "Acme Corporation",
      "email": "contact@acme.com",
      "phone": "+1-555-0100",
      "address": "100 Industrial Parkway",
      "currency": "USD",
      "tierId": "tier-uuid-1",
      "salesRepId": "user-uuid-1",
      "tier": {
        "id": "tier-uuid-1",
        "name": "GOLD",
        "discountPct": "15.00"
      },
      "salesRep": {
        "id": "user-uuid-1",
        "name": "Sarah Sales Rep",
        "email": "sales@dealflow360.com"
      }
    }
  ]
}
```

### `GET /api/customers/:id`
Fetch single customer details with tier, sales rep, and recent quotations.
* **Access**: Role-scoped (Customer can only access their own record)

### `POST /api/customers`
Create new customer record.
* **Access**: `ADMIN`, `SALES_MANAGER`, `SALES_REP`

### `PUT /api/customers/:id`
Update customer details.
* **Access**: `ADMIN`, `SALES_MANAGER`, `SALES_REP` (Customers can update only contact info)

### `GET /api/customers/tiers`
List all customer tiers (`BRONZE` 5%, `SILVER` 10%, `GOLD` 15%).
* **Access**: Authenticated

---

## 5. Quotations API (`/api/quotations`)

### Quotation Statuses
1. `DRAFT` - Being built or edited by Sales Rep
2. `PENDING_APPROVAL` - Awaiting manager and/or finance approval
3. `APPROVED` - Approved and ready to share with customer
4. `NEGOTIATION` - Under active customer proposal / negotiation
5. `CUSTOMER_CONFIRMED` - Customer accepted quotation
6. `ORDER_CONFIRMED` - Order confirmed; ready for fulfillment
7. `FULFILLMENT` - Warehouse stock allocation & dispatch
8. `PARTIALLY_FULFILLED` - In partial shipment
9. `FULFILLED` - Completely shipped
10. `REJECTED` - Rejected by approver
11. `RETURNED` - Returned to draft for revision
12. `CANCELLED` - Cancelled

### `GET /api/quotations`
List quotations.
* **Access**:
  * `CUSTOMER`: Sees only quotes for their customer account
  * `SALES_REP`: Sees their assigned quotes
  * `ADMIN`, `SALES_MANAGER`, `FINANCE`, `OPERATIONS`: Sees all quotes
* **Query Parameters**: `status`, `customerId`, `salesRepId`, `limit`, `offset`

### `GET /api/quotations/:id`
Get quotation details with customer, line items, and approval history.

### `POST /api/quotations`
Create a new quotation. Backend automatically recalculates all totals using exact Decimal arithmetic.
* **Access**: `ADMIN`, `SALES_MANAGER`, `SALES_REP`, `CUSTOMER`
* **Request Body**:
```json
{
  "customerId": "cust-uuid-1",
  "currency": "USD",
  "notes": "Q3 hardware expansion quote",
  "lines": [
    {
      "productId": "p-laptop-uuid",
      "quantity": 10,
      "unitPrice": 1200.00,
      "unitCost": 800.00,
      "discountPercent": 12.00,
      "taxRate": 18.00,
      "billingType": "ONE_TIME"
    },
    {
      "productId": "p-setup-uuid",
      "quantity": 1,
      "unitPrice": 500.00,
      "unitCost": 250.00,
      "discountPercent": 18.00,
      "taxRate": 18.00,
      "billingType": "ONE_TIME"
    }
  ]
}
```

### `PUT /api/quotations/:id`
Update an existing quotation.
* **Access**: Permitted only in `DRAFT` or `NEGOTIATION` status. Arbitrary status changes via PUT are strictly blocked.

### `POST /api/quotations/:id/discount-check`
Runs the database-driven discount governance and risk engine.
* **Access**: Authenticated
* **Response**:
```json
{
  "success": true,
  "data": {
    "allowed": 10,
    "current": 18,
    "excess": 8,
    "risk": "HIGH",
    "riskScore": 70,
    "approvalRequired": true,
    "requiredRoles": ["SALES_MANAGER", "FINANCE"],
    "reason": "Significant discount excess of 8.0% exceeds standard policy. Service category discount excess impacts labor and delivery costs",
    "affectedLines": [
      {
        "lineId": "line-uuid-2",
        "productName": "Office Setup Service",
        "sku": "SV-SETUP-001",
        "category": "Services",
        "requestedDiscount": 18,
        "allowedDiscount": 10,
        "excessPercentage": 8
      }
    ]
  }
}
```

### `POST /api/quotations/:id/submit`
Submits quotation for approval.
* If approval is required: moves to `PENDING_APPROVAL` and initializes approval step sequence.
* If no approval required: moves directly to `APPROVED`.
* **Access**: `SALES_REP`, `ADMIN`, `CUSTOMER`

### `POST /api/quotations/:id/confirm`
Customer confirms the quotation. Moves status from `APPROVED` $\rightarrow$ `CUSTOMER_CONFIRMED`.
* **Access**: Customer or Admin

---

## 6. Approvals API (`/api/approvals`)

### `GET /api/approvals`
List pending approvals.
* **Access**: `SALES_MANAGER`, `FINANCE`, `ADMIN` (Customers are blocked with 403)
* **Query Parameters**: `status=PENDING`, `quotationId`

### `POST /api/approvals/:id/approve`
Approve current approval step.
* If deal requires multi-step approval (e.g. Sales Manager then Finance):
  * Step 1 approval forwards request to Step 2 (`FINANCE`).
  * Quotation remains `PENDING_APPROVAL`.
* Final step approval:
  * Transitions quotation to `APPROVED`.
* **Access**: User must hold the required role for that step (Sales reps cannot approve their own deals).
* **Request Body**:
```json
{
  "comments": "Approved 8% service discount based on strategic client relationship."
}
```

### `POST /api/approvals/:id/reject`
Reject quotation. Transitions quotation to `REJECTED`.
* **Access**: `SALES_MANAGER`, `FINANCE`, `ADMIN`

### `POST /api/approvals/:id/return`
Return quotation to draft for revision. Transitions quotation to `DRAFT`.
* **Access**: `SALES_MANAGER`, `FINANCE`, `ADMIN`

---

## 7. Audit Logging API (`/api/audit-logs`)

### `GET /api/audit-logs`
View immutable audit trail of operations.
* **Access**: `ADMIN`, `SALES_MANAGER`
* **Query Parameters**: `entityType=QUOTATION`, `entityId`, `limit`, `offset`

---

## 8. Developer 3 Integration Handoff Contract

### Converting Quotation to Sales Order
When a quotation reaches `status = 'CUSTOMER_CONFIRMED'`, Developer 3's Operations module can convert it into a `sales_orders` record.

**Data Exposed by `GET /api/quotations/:id` for Order Conversion**:
* `quotation.id` $\rightarrow$ `sales_orders.quotation_id`
* `quotation.customerId` $\rightarrow$ `sales_orders.customer_id`
* `quotation.totalAmount` $\rightarrow$ `sales_orders.total_amount`
* `quotation.currency` $\rightarrow$ Currency for order
* `quotation.lines`:
  * `quantity` $\rightarrow$ Reserved quantity for fulfillment
  * `productId` $\rightarrow$ Target inventory product
  * `billingType`:
    * `'ONE_TIME'`: Triggers warehouse allocation and shipping lines
    * `'RECURRING'`: Triggers subscription creation and billing schedule generation
