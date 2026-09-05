# DealFlow360 — Operations, Inventory, Fulfillment & Billing API Specification

**Author**: Developer 3 (Operations, Fulfillment & Billing)  
**Base URL**: `http://localhost:5000/api`  
**Authentication**: Bearer Token via HTTP Header: `Authorization: Bearer <access_token>`

---

## 1. Overview & Architecture

Developer 3 completes the post-sale lifecycle of **DealFlow360**:
1. **Sales Orders**: Authoritative conversion of `CUSTOMER_CONFIRMED` quotations, preserving exact Decimal line-item pricing, quantities, discounts, and idempotency.
2. **Multi-Warehouse Inventory**: Real-time stock math across multiple facilities (`Ahmedabad WH-AMD-01`, `Vadodara WH-BDQ-01`), strict stock reservations, and negative stock prevention.
3. **Fulfillment Orders**: Multi-warehouse allocation, partial dispatch, carrier tracking numbers, and shipment updates.
4. **Backorders**: Automatic generation when stock is short, backorder queue tracking, restock fulfillment, and order resolution to `FULFILLED`.
5. **Subscriptions & Billing Schedules**: Automatic subscription provisioning for recurring products with 12-period billing schedules and due dates.
6. **Invoicing**: Authoritative invoice generation from Sales Orders or recurring schedules, net-30 terms, line preservation, and idempotent creation.
7. **Payments**: Real payment audit records, partial payments, full settlements, and strict overpayment prevention (`amount > balanceDue` rejected with 400).
8. **Operations Dashboard & Analytics**: Live telemetry aggregating active orders, backorders, fulfillment status, inventory valuation, and cash collection.
9. **Customer Portal Scoping**: Customers view only their own orders and invoices; internal costs, stock allocations, and warehouses remain strictly isolated.

---

## 2. Sales Orders API (`/api/orders`)

### `POST /api/orders/from-quotation/:quotationId`
Converts a `CUSTOMER_CONFIRMED` quotation into an authoritative Sales Order.
* **Access**: `ADMIN`, `OPS_FINANCE`, `SALES_MANAGER`, `SALES_REP`, `CUSTOMER`
* **Idempotency**: Repeated requests return the existing Sales Order without duplication.
* **Response**:
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Sales order created from quotation",
  "data": {
    "order": {
      "id": "order-uuid-1",
      "orderNumber": "SO-00001",
      "quotationId": "quote-uuid-1",
      "customerId": "cust-uuid-1",
      "status": "ORDER_CONFIRMED",
      "subtotal": "12000.00",
      "discountAmount": "600.00",
      "taxAmount": "2052.00",
      "totalAmount": "13452.00",
      "lines": [
        {
          "id": "sol-uuid-1",
          "productId": "p-laptop-uuid",
          "quantity": 10,
          "unitPrice": "1200.00",
          "lineTotal": "13452.00",
          "quantityReserved": 0,
          "quantityFulfilled": 0,
          "quantityBackordered": 0
        }
      ]
    }
  }
}
```

### `GET /api/orders`
List all sales orders with status filtering.
* **Access**: Role-scoped (Internal ops see all, Customer sees owned orders).
* **Query Parameters**: `status`, `customerId`, `limit`, `offset`.

### `GET /api/orders/:id`
Fetch single sales order with lines, customer, fulfillments, invoices, and backorders.

---

## 3. Multi-Warehouse Inventory API (`/api/warehouses`, `/api/inventory`)

### `GET /api/warehouses`
List active warehouse facilities with location and operational status.
* **Sample Facilities**:
  * `WH-AMD-01`: Ahmedabad Central Warehouse
  * `WH-BDQ-01`: Vadodara Express Hub

### `GET /api/inventory`
Query live multi-warehouse stock positions.
* **Formula**: `availableQuantity = quantityOnHand - quantityReserved`
* **Response**:
```json
{
  "success": true,
  "data": {
    "stocks": [
      {
        "id": "stock-uuid-1",
        "warehouseId": "wh-amd-uuid",
        "warehouse": { "name": "Ahmedabad Central Warehouse", "code": "WH-AMD-01" },
        "productId": "p-laptop-uuid",
        "product": { "name": "Enterprise Pro Laptop", "sku": "HW-LAPTOP-001" },
        "quantityOnHand": 20,
        "quantityReserved": 6,
        "availableQuantity": 14,
        "valuation": "16000.00"
      }
    ]
  }
}
```

### `POST /api/inventory/adjust`
Adjust physical inventory stock with audit logging.
* **Access**: `ADMIN`, `OPS_FINANCE`, `OPERATIONS`
* **Request Body**:
```json
{
  "warehouseId": "wh-amd-uuid",
  "productId": "p-laptop-uuid",
  "change": 10,
  "reason": "Replenishment shipment from manufacturer"
}
```

---

## 4. Fulfillment & Backorders API (`/api/fulfillment`, `/api/backorders`)

### `POST /api/fulfillment` (or `/api/fulfillments`)
Create fulfillment order with warehouse allocation. If requested quantity exceeds available warehouse stock, the deficit is automatically routed to a `Backorder`.
* **Access**: `ADMIN`, `OPS_FINANCE`, `OPERATIONS`
* **Request Body**:
```json
{
  "salesOrderId": "order-uuid-1",
  "warehouseId": "wh-amd-uuid",
  "notes": "Standard express fulfillment"
}
```

### `POST /api/fulfillment/:id/fulfill`
Dispatch shipment with carrier tracking.
* **Request Body**:
```json
{
  "trackingNumber": "TRK-BLUEDART-889900",
  "carrier": "BlueDart Express"
}
```
* **Effect**: Transitions fulfillment order to `SHIPPED`, decrements reserved and physical stock.

### `GET /api/backorders`
List active deficit backorders awaiting replenishment.
* **Query Parameters**: `status` (`PENDING`, `PARTIALLY_FULFILLED`, `FULFILLED`), `salesOrderId`.

### `POST /api/backorders/:id/fulfill`
Fulfill pending backorders once stock arrives.
* **Request Body**:
```json
{
  "warehouseId": "wh-bdq-uuid",
  "quantity": 4
}
```
* **Effect**: Deducts physical stock, updates backorder to `FULFILLED`. When all sales order lines are satisfied, transitions sales order to `FULFILLED`.

---

## 5. Billing, Invoices & Payments API (`/api/invoices`, `/api/payments`, `/api/billing`)

### `POST /api/invoices/from-order/:orderId`
Generates authoritative invoice from Sales Order.
* **Idempotency**: Calling multiple times returns the same invoice.
* **Response**:
```json
{
  "success": true,
  "data": {
    "invoice": {
      "id": "inv-uuid-1",
      "invoiceNumber": "INV-00001",
      "salesOrderId": "order-uuid-1",
      "totalAmount": "13452.00",
      "amountPaid": "0.00",
      "balanceDue": "13452.00",
      "status": "PENDING"
    }
  }
}
```

### `POST /api/payments`
Record invoice payment with strict overpayment protection.
* **Request Body**:
```json
{
  "invoiceId": "inv-uuid-1",
  "amount": 5000.00,
  "paymentMethod": "BANK_TRANSFER",
  "reference": "WIRE-2026-998811"
}
```
* **Overpayment Validation**: If `amount > balanceDue`, returns `400 Bad Request` with error message `"Payment amount ($X) cannot exceed the outstanding balance due ($Y)"`.
* **Status Updates**: Transitions invoice to `PARTIALLY_PAID` or `PAID` when balance reaches `0`.

---

## 6. Subscriptions & Billing Schedules API (`/api/subscriptions`, `/api/billing-schedules`)

### `GET /api/subscriptions`
List active recurring customer subscriptions.

### `GET /api/billing-schedules`
List generated 12-month billing schedules across subscriptions.
* **Response**:
```json
{
  "success": true,
  "data": {
    "schedules": [
      {
        "id": "sched-uuid-1",
        "subscriptionId": "sub-uuid-1",
        "periodNumber": 1,
        "dueDate": "2026-10-01T00:00:00.000Z",
        "amount": "500.00",
        "status": "PENDING"
      }
    ]
  }
}
```

### `POST /api/schedules/:scheduleId/invoice`
Generates recurring period invoice from billing schedule.

---

## 7. Operations Dashboard & Analytics API (`/api/operations/dashboard`)

### `GET /api/operations/dashboard`
Live operations cockpit aggregating:
* `totalOrders`: Count of confirmed sales orders
* `pendingFulfillmentCount`: Orders awaiting warehouse dispatch
* `backordersCount`: Active inventory shortage backorders
* `inventoryValuation`: Total value of stock on hand
* `invoicedTotal`: Total invoice volume
* `outstandingBalance`: Total unpaid invoice balance
* `warehouseStockSummary`: Per-warehouse capacity and inventory counts
