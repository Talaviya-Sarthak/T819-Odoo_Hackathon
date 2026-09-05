'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const app = require('../src/app');
const prisma = require('../src/database/prisma');
const { connect, close } = require('../src/database/index');

let server;
let baseUrl;

test.before(async () => {
  await connect();
  await new Promise((resolve) => {
    server = app.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://localhost:${port}`;
      resolve();
    });
  });
});

test.after(async () => {
  if (server) await new Promise((resolve) => server.close(resolve));
  await close();
});

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

test('Developer 2 Full End-to-End Demo Workflow (Steps 1 to 28)', async (t) => {
  // Step 1: SALES_REP login
  const repLogin = await api('POST', '/api/auth/login', {
    email: 'rep@dealflow360.com',
    password: 'demo1234',
  });
  assert.equal(repLogin.status, 200, 'Sales Rep login must succeed');
  const repToken = repLogin.data.accessToken;
  assert.ok(repToken, 'Token should be returned');

  // Step 2: Dashboard data loads with real metrics
  const quotesRes = await api('GET', '/api/quotations', null, repToken);
  assert.equal(quotesRes.status, 200, 'Quotations list fetched');
  const quotesList = quotesRes.data.quotations || quotesRes.data.data;
  assert.ok(Array.isArray(quotesList), 'Returns array of quotations');

  // Step 3: Get customers & products
  const custRes = await api('GET', '/api/customers', null, repToken);
  assert.equal(custRes.status, 200);
  const custList = custRes.data.customers || custRes.data.data;
  const apexCustomer = custList.find((c) => c.name.toLowerCase().includes('apex'));
  assert.ok(apexCustomer, 'Apex Global customer should exist in seed');

  const prodRes = await api('GET', '/api/products', null, repToken);
  assert.equal(prodRes.status, 200);
  const prodList = prodRes.data.products || prodRes.data.data;
  const laptop = prodList.find((p) => p.name.includes('Laptop'));
  const service = prodList.find((p) => p.name.includes('Office Setup') || p.name.includes('Support'));
  const dock = prodList.find((p) => p.name.includes('Docking') || p.name.includes('Monitor') || p.name.includes('Bag'));
  assert.ok(laptop, 'Laptop product exists');
  assert.ok(service, 'Service product exists');
  assert.ok(dock, 'Companion product exists');

  // Step 4-6: Create quotation with Laptop x10 (12% disc) and Service x1 (18% disc)
  const createRes = await api('POST', '/api/quotations', {
    customerId: apexCustomer.id,
    notes: 'Developer 2 E2E Demo Quotation',
    lines: [
      {
        productId: laptop.id,
        quantity: 10,
        unitPrice: Number(laptop.basePrice),
        discountPercent: 12,
      },
      {
        productId: service.id,
        quantity: 1,
        unitPrice: Number(service.basePrice),
        discountPercent: 18,
      },
    ],
  }, repToken);
  assert.equal(createRes.status, 201, 'Quotation draft created');
  const quote = createRes.data.quotation || createRes.data.data;
  const quoteId = quote.id;

  // Step 7-9: Check Discount Governance & Risk
  const govRes = await api('POST', `/api/quotations/${quoteId}/discount-check`, null, repToken);
  assert.equal(govRes.status, 200, 'Discount check succeeds');
  const gov = govRes.data.data || govRes.data;
  assert.equal(gov.requiresApproval, true, 'Excess discount requires approval');
  assert.ok(gov.excessDiscount > 0, 'Excess discount must be flagged');

  // Step 10-11: Submit quotation for approval -> transitions to PENDING_APPROVAL
  const submitRes = await api('POST', `/api/quotations/${quoteId}/submit`, null, repToken);
  assert.equal(submitRes.status, 200, 'Quotation submitted');
  const submittedQ = submitRes.data.quotation || submitRes.data.data?.quotation;
  assert.equal(submittedQ.status, 'PENDING_APPROVAL');

  // Step 12-14: SALES_MANAGER logs in and approves
  const mgrLogin = await api('POST', '/api/auth/login', {
    email: 'manager@dealflow360.com',
    password: 'demo1234',
  });
  assert.equal(mgrLogin.status, 200, 'Manager login succeeds');
  const mgrToken = mgrLogin.data.accessToken;

  const pendingRes = await api('GET', '/api/approvals/pending', null, mgrToken);
  assert.equal(pendingRes.status, 200);
  const pendingList = pendingRes.data.approvals || pendingRes.data.data;
  const pendingItem = pendingList.find((a) => a.quotationId === quoteId);
  assert.ok(pendingItem, 'Pending approval item should be in manager queue');

  const approveStep1 = await api('POST', `/api/approvals/${pendingItem.id}/approve`, {
    comments: 'Manager approved 12% laptop and 18% service discount',
  }, mgrToken);
  assert.equal(approveStep1.status, 200, 'Manager approval accepted');

  // If Finance is required, login as Finance and approve step 2
  if (gov.approvalRoles && gov.approvalRoles.includes('FINANCE')) {
    const finLogin = await api('POST', '/api/auth/login', {
      email: 'finance@dealflow360.com',
      password: 'demo1234',
    });
    const finToken = finLogin.data.accessToken;
    const finPendingRes = await api('GET', '/api/approvals/pending', null, finToken);
    const finList = finPendingRes.data.approvals || finPendingRes.data.data;
    const finItem = finList.find((a) => a.quotationId === quoteId);
    if (finItem) {
      await api('POST', `/api/approvals/${finItem.id}/approve`, { comments: 'Finance margin check passed' }, finToken);
    }
  }

  // Step 15: Quotation status is now APPROVED
  const approvedRes = await api('GET', `/api/quotations/${quoteId}`, null, repToken);
  const approvedQ = approvedRes.data.quotation || approvedRes.data.data;
  assert.equal(approvedQ.status, 'APPROVED', 'Quotation status is APPROVED');

  // Step 16: Recommendations appear
  const recsRes = await api('GET', `/api/quotations/${quoteId}/recommendations`, null, repToken);
  assert.equal(recsRes.status, 200, 'Recommendations fetched');
  const recs = recsRes.data.recommendations || recsRes.data.data?.recommendations;
  assert.ok(recs.length > 0, 'At least one recommendation generated');
  const topRec = recs[0];

  // Step 17-18: Add recommended item to quote -> totals refresh
  const addRecRes = await api('POST', `/api/recommendations/${topRec.id}/add`, null, repToken);
  assert.equal(addRecRes.status, 200, 'Recommendation added to quotation');
  const updatedWithRec = addRecRes.data.quotation || addRecRes.data.recommendation?.quotation || addRecRes.data.data?.quotation;
  assert.ok(updatedWithRec.lines.length >= 3, 'Line count increased with recommended product');

  // Step 19-20: CUSTOMER logs in (apex.buyer@dealflow360.com)
  const custLogin = await api('POST', '/api/auth/login', {
    email: 'apex.buyer@dealflow360.com',
    password: 'demo1234',
  });
  assert.equal(custLogin.status, 200, 'Customer login succeeds');
  const custToken = custLogin.data.accessToken;

  // Customer sees only Apex Global quotes
  const custQuotesRes = await api('GET', '/api/quotations', null, custToken);
  assert.equal(custQuotesRes.status, 200);
  const custQList = custQuotesRes.data.quotations || custQuotesRes.data.data;
  assert.ok(custQList.every((q) => q.customerId === apexCustomer.id), 'Customer data isolation verified');

  // Step 21-22: Customer sends negotiation message
  const sendMsgRes = await api('POST', `/api/quotations/${quoteId}/negotiation/message`, {
    message: 'Hello, we are considering adding 5 more units. Can we get a 15% discount?',
  }, custToken);
  assert.equal(sendMsgRes.status, 201, 'Customer message sent');

  const threadRes = await api('GET', `/api/quotations/${quoteId}/negotiation`, null, custToken);
  assert.equal(threadRes.status, 200);
  const thread = threadRes.data.negotiation || threadRes.data;
  assert.ok(thread.messages.length > 0, 'Thread contains message');

  // Step 23-24: Customer requests higher counter-discount (15%) -> sends to approval again
  const changeReqRes = await api('POST', `/api/quotations/${quoteId}/negotiation/request-change`, {
    requestedDiscountPercent: 15,
    notes: 'Bulk commitment counter-proposal',
  }, custToken);
  assert.equal(changeReqRes.status, 201, 'Counter-discount request recorded');
  assert.equal(changeReqRes.data.status || changeReqRes.data.data?.status, 'PENDING_APPROVAL');

  // Step 25: Manager approves counter-offer
  const mgrPendingRes2 = await api('GET', '/api/approvals/pending', null, mgrToken);
  const mgrList2 = mgrPendingRes2.data.approvals || mgrPendingRes2.data.data;
  const counterApproval = mgrList2.find((a) => a.quotationId === quoteId);
  assert.ok(counterApproval, 'Counter-offer approval item should be in manager queue');

  await api('POST', `/api/approvals/${counterApproval.id}/approve`, {
    comments: 'Manager accepted 15% bulk commitment counter-discount',
  }, mgrToken);

  // Step 26: Customer sees updated quotation as APPROVED
  const custUpdatedRes = await api('GET', `/api/quotations/${quoteId}`, null, custToken);
  const custUpdatedQ = custUpdatedRes.data.quotation || custUpdatedRes.data.data;
  assert.equal(custUpdatedQ.status, 'APPROVED', 'Quotation is APPROVED');

  // Step 27-28: Customer confirms quotation -> becomes CUSTOMER_CONFIRMED
  const confirmRes = await api('POST', `/api/quotations/${quoteId}/customer-confirm`, null, custToken);
  assert.equal(confirmRes.status, 200, 'Customer confirmation accepted');
  const confirmedQ = confirmRes.data.quotation || confirmRes.data.data;
  assert.equal(confirmedQ.status, 'CUSTOMER_CONFIRMED', 'Status is CUSTOMER_CONFIRMED');
});
