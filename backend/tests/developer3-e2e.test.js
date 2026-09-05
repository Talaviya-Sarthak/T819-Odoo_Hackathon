'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const baseUrl = process.env.TEST_BASE_URL || 'http://localhost:5000';

async function api(method, path, body = null, token = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json();
  return { status: res.status, data };
}

test('Developer 3 Operations & Billing Lifecycle Full Flow (Steps 1 to 12)', async (t) => {
  // Step 1: Authentication for Roles
  const adminLogin = await api('POST', '/api/auth/login', {
    email: 'admin@dealflow360.com',
    password: 'demo1234',
  });
  assert.equal(adminLogin.status, 200, 'Admin login succeeds');
  const adminToken = adminLogin.data.accessToken;

  const repLogin = await api('POST', '/api/auth/login', {
    email: 'rep@dealflow360.com',
    password: 'demo1234',
  });
  assert.equal(repLogin.status, 200, 'Sales Rep login succeeds');
  const repToken = repLogin.data.accessToken;

  const custLogin = await api('POST', '/api/auth/login', {
    email: 'apex.buyer@dealflow360.com',
    password: 'demo1234',
  });
  assert.equal(custLogin.status, 200, 'Customer login succeeds');
  const custToken = custLogin.data.accessToken;

  // Step 2: Fetch Products and Customer
  const custRes = await api('GET', '/api/customers', null, repToken);
  assert.equal(custRes.status, 200);
  const customers = custRes.data.customers || custRes.data.data;
  const apexCustomer = customers.find((c) => c.name.includes('Apex')) || customers[0];
  assert.ok(apexCustomer, 'Apex customer exists');

  const prodRes = await api('GET', '/api/products', null, repToken);
  assert.equal(prodRes.status, 200);
  const products = prodRes.data.products || prodRes.data.data;
  const laptop = products.find((p) => p.name.includes('Laptop')) || products[0];
  const recurringItem = products.find((p) => 
    p.name.toLowerCase().includes('support') || 
    p.name.toLowerCase().includes('backup') || 
    p.name.toLowerCase().includes('cloud')
  ) || products[1];
  assert.ok(laptop, 'Physical product exists');

  // Step 3: Create Quotation with Physical + Recurring items
  const quoteRes = await api('POST', '/api/quotations', {
    customerId: apexCustomer.id,
    notes: 'Developer 3 E2E Lifecycle Demo',
    lines: [
      {
        productId: laptop.id,
        quantity: 10,
        unitPrice: Number(laptop.basePrice || 1200),
        discountPercent: 5,
        billingType: 'ONE_TIME',
      },
      {
        productId: recurringItem.id,
        quantity: 1,
        unitPrice: Number(recurringItem.basePrice || 500),
        discountPercent: 0,
        billingType: 'RECURRING',
      },
    ],
  }, repToken);
  assert.equal(quoteRes.status, 201, 'Draft quotation created');
  const quote = quoteRes.data.quotation || quoteRes.data.data;
  assert.ok(quote.id, 'Quotation ID returned');

  // Submit and approve quotation
  const submitRes = await api('POST', `/api/quotations/${quote.id}/submit`, null, repToken);
  assert.ok([200, 201].includes(submitRes.status), 'Submitted for approval');

  // If in PENDING_APPROVAL, approve with manager/admin
  const pendingApprovals = await api('GET', '/api/approvals/pending', null, adminToken);
  const pendingList = pendingApprovals.data.approvals || pendingApprovals.data.data || [];
  const myApproval = pendingList.find((a) => a.quotationId === quote.id);
  if (myApproval) {
    await api('POST', `/api/approvals/${myApproval.id}/approve`, { comments: 'Approved by Admin for D3 flow' }, adminToken);
  }

  // Customer confirms the quote -> reaches CUSTOMER_CONFIRMED
  const confirmRes = await api('POST', `/api/quotations/${quote.id}/customer-confirm`, null, custToken);
  assert.ok([200, 201].includes(confirmRes.status), 'Customer confirms quotation');

  // Step 4: Convert Quotation to Sales Order
  const orderRes = await api('POST', `/api/orders/from-quotation/${quote.id}`, {}, adminToken);
  assert.equal(orderRes.status, 201, 'Sales order created');
  const order = orderRes.data.order || orderRes.data.data;
  assert.ok(order.id, 'Order ID created');
  assert.equal(order.quotationId, quote.id, 'Linked to quotation');
  assert.equal(order.lines.length, 2, '2 line items preserved');

  // Idempotency: call again, returns existing order
  const idempOrderRes = await api('POST', `/api/orders/from-quotation/${quote.id}`, {}, adminToken);
  assert.ok([200, 201].includes(idempOrderRes.status), 'Idempotent order creation succeeds');
  const idempOrder = idempOrderRes.data.order || idempOrderRes.data.data;
  assert.equal(idempOrder.id, order.id, 'Returns exact same order ID');

  // Step 5: Verify Subscription & 12 Billing Schedules
  const subsRes = await api('GET', `/api/billing/subscriptions?salesOrderId=${order.id}`, null, adminToken);
  assert.equal(subsRes.status, 200);
  const subs = subsRes.data.subscriptions || subsRes.data.data || [];
  assert.ok(subs.length >= 1, 'Subscription created for recurring item');
  const sub = subs[0];

  const schedsRes = await api('GET', `/api/billing/schedules?subscriptionId=${sub.id}`, null, adminToken);
  assert.equal(schedsRes.status, 200);
  const schedules = schedsRes.data.schedules || schedsRes.data.data || [];
  assert.equal(schedules.length, 12, 'Exactly 12 billing schedules generated');

  // Step 6: Multi-Warehouse Inventory & Partial Fulfillment
  const whRes = await api('GET', '/api/warehouses', null, adminToken);
  assert.equal(whRes.status, 200);
  const warehouses = whRes.data.warehouses || whRes.data.data;
  const amdWh = warehouses.find((w) => w.code === 'WH-AMD-01') || warehouses[0];
  const bdqWh = warehouses.find((w) => w.code === 'WH-BDQ-01') || warehouses[1];

  // Adjust stock in AMD warehouse to 6 units so 10 units requested triggers partial fulfillment + 4 backorders
  const invListRes = await api('GET', '/api/inventory', null, adminToken);
  assert.equal(invListRes.status, 200);
  const invItems = invListRes.data.stocks || invListRes.data.data || [];
  const amdLaptopStock = invItems.find((s) => s.warehouseId === amdWh.id && s.productId === laptop.id);
  const currentAmdQty = amdLaptopStock ? amdLaptopStock.quantityOnHand : 0;
  const targetAmdQty = 6;
  const diffAmd = targetAmdQty - currentAmdQty;
  if (diffAmd !== 0) {
    await api('POST', '/api/inventory/adjust', {
      warehouseId: amdWh.id,
      productId: laptop.id,
      change: diffAmd,
      reason: 'Align stock for E2E partial fulfillment test',
    }, adminToken);
  }

  // Create Fulfillment Order from AMD (allocated: 6, backordered: 4)
  const foRes = await api('POST', '/api/fulfillment', {
    salesOrderId: order.id,
    warehouseId: amdWh.id,
    notes: 'Partial fulfillment allocation test from WH-AMD-01',
  }, adminToken);
  assert.equal(foRes.status, 201, 'Fulfillment Order created');
  const fo = foRes.data.fulfillmentOrder || foRes.data.data;
  assert.ok(fo.id, 'Fulfillment Order ID exists');

  // Verify backorder exists
  const boRes = await api('GET', `/api/backorders?salesOrderId=${order.id}`, null, adminToken);
  assert.equal(boRes.status, 200);
  const backorders = boRes.data.backorders || boRes.data.data;
  assert.ok(backorders.length >= 1, 'Backorder record created');
  const laptopBo = backorders.find((b) => b.productId === laptop.id);
  assert.ok(laptopBo, 'Laptop backorder exists');
  assert.equal(laptopBo.quantity, 4, 'Backorder quantity is 4');
  assert.equal(laptopBo.status, 'PENDING', 'Backorder status is PENDING');

  // Step 7: Dispatch / Ship Fulfillment Order
  const dispatchRes = await api('POST', `/api/fulfillment/${fo.id}/fulfill`, {
    trackingNumber: 'TRK-BD-882200',
    carrier: 'BlueDart Express',
  }, adminToken);
  assert.equal(dispatchRes.status, 200, 'Fulfillment order dispatched');

  // Step 8: Restock BDQ Warehouse & Fulfill Backorder
  await api('POST', '/api/inventory/adjust', {
    warehouseId: bdqWh.id,
    productId: laptop.id,
    change: 10,
    reason: 'Incoming shipment from manufacturer',
  }, adminToken);

  const boFulfillRes = await api('POST', `/api/backorders/${laptopBo.id}/fulfill`, {
    warehouseId: bdqWh.id,
    quantity: 4,
  }, adminToken);
  assert.equal(boFulfillRes.status, 200, 'Backorder fulfilled');
  const boUpdated = boFulfillRes.data.backorder || boFulfillRes.data.data;
  assert.equal(boUpdated.status, 'FULFILLED', 'Backorder status is FULFILLED');

  // Verify refreshed order status
  const orderRefreshed = await api('GET', `/api/orders/${order.id}`, null, adminToken);
  const ord = orderRefreshed.data.order || orderRefreshed.data.data;
  assert.ok(['FULFILLED', 'ORDER_CONFIRMED', 'PARTIALLY_FULFILLED'].includes(ord.status));

  // Step 9: Authoritative Invoicing from Sales Order
  const invRes = await api('POST', `/api/billing/invoices/from-order/${order.id}`, {}, adminToken);
  assert.equal(invRes.status, 201, 'Invoice created from order');
  const invoice = invRes.data.invoice || invRes.data.data;
  assert.ok(invoice.id, 'Invoice ID exists');
  assert.equal(Number(invoice.totalAmount), Number(order.totalAmount), 'Invoice total matches Sales Order');
  assert.equal(Number(invoice.balanceDue), Number(order.totalAmount), 'Balance due matches initial total');

  // Idempotency: calling again returns existing invoice
  const invIdempRes = await api('POST', `/api/billing/invoices/from-order/${order.id}`, {}, adminToken);
  assert.ok([200, 201].includes(invIdempRes.status), 'Invoice idempotency succeeds');
  const invIdemp = invIdempRes.data.invoice || invIdempRes.data.data;
  assert.equal(invIdemp.id, invoice.id, 'Same invoice returned');

  // Step 10: Payment Recording & Overpayment Prevention
  // Overpayment attempt
  const overpayRes = await api('POST', '/api/billing/payments', {
    invoiceId: invoice.id,
    amount: Number(invoice.balanceDue) + 1000,
    paymentMethod: 'CREDIT_CARD',
  }, adminToken);
  assert.equal(overpayRes.status, 400, 'Overpayment rejected with 400 Bad Request');

  // Partial payment ($1,000)
  const partialRes = await api('POST', '/api/billing/payments', {
    invoiceId: invoice.id,
    amount: 1000,
    paymentMethod: 'BANK_TRANSFER',
    reference: 'WIRE-E2E-001',
  }, adminToken);
  assert.equal(partialRes.status, 201, 'Partial payment accepted');

  const invAfterPartial = await api('GET', `/api/billing/invoices/${invoice.id}`, null, adminToken);
  const invP = invAfterPartial.data.invoice || invAfterPartial.data.data;
  assert.equal(Number(invP.amountPaid), 1000, 'Amount paid is 1000');
  assert.equal(invP.status, 'PARTIALLY_PAID', 'Status is PARTIALLY_PAID');

  // Full settlement
  const settleRes = await api('POST', '/api/billing/payments', {
    invoiceId: invoice.id,
    amount: Number(invP.balanceDue),
    paymentMethod: 'CREDIT_CARD',
    reference: 'CARD-E2E-002',
  }, adminToken);
  assert.equal(settleRes.status, 201, 'Settlement payment accepted');

  const invAfterSettle = await api('GET', `/api/billing/invoices/${invoice.id}`, null, adminToken);
  const invS = invAfterSettle.data.invoice || invAfterSettle.data.data;
  assert.equal(Number(invS.balanceDue), 0, 'Balance due is 0');
  assert.equal(invS.status, 'PAID', 'Status is PAID');

  // Step 11: Billing Schedule to Invoice
  const sched1 = schedules[0];
  const schedInvRes = await api('POST', `/api/billing/schedules/${sched1.id}/invoice`, {}, adminToken);
  assert.ok([200, 201].includes(schedInvRes.status), 'Scheduled invoice created');

  // Step 12: Operations Dashboard & Analytics
  const dashRes = await api('GET', '/api/operations/dashboard', null, adminToken);
  assert.equal(dashRes.status, 200, 'Operations dashboard fetched');
  const dash = dashRes.data.dashboard || dashRes.data.data;
  assert.ok(dash, 'Dashboard payload exists');

  // Customer Portal Isolation Check
  const custOrdersRes = await api('GET', '/api/customer/orders', null, custToken);
  assert.equal(custOrdersRes.status, 200, 'Customer orders fetched');
  const custOrders = custOrdersRes.data.orders || custOrdersRes.data.data;
  assert.ok(Array.isArray(custOrders), 'Orders returned as array');
  assert.ok(custOrders.every((o) => o.customerId === apexCustomer.id), 'Only customer orders returned');

  const custInvoicesRes = await api('GET', '/api/customer/invoices', null, custToken);
  assert.equal(custInvoicesRes.status, 200, 'Customer invoices fetched');
  const custInvoices = custInvoicesRes.data.invoices || custInvoicesRes.data.data;
  assert.ok(Array.isArray(custInvoices), 'Invoices returned as array');
  assert.ok(custInvoices.every((i) => i.customerId === apexCustomer.id), 'Only customer invoices returned');
});
