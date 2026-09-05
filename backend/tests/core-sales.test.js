'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const prisma = require('../src/database/prisma');

const { calculateLine, calculateQuotation, Decimal } = require('../src/services/calculation.service');
const { getEffectiveProductPrice } = require('../src/services/pricing.service');
const { checkQuotationDiscounts } = require('../src/services/discount-governance.service');
const { calculateRisk } = require('../src/services/risk.service');
const { validateTransition, assertEditable } = require('../src/services/quotation-state.service');
const quotationsService = require('../src/modules/quotations/quotations.service');
const approvalsService = require('../src/modules/approvals/approvals.service');
const customersService = require('../src/modules/customers/customers.service');
const productsService = require('../src/modules/products/products.service');
const { listAuditLogs } = require('../src/services/audit.service');

test('DealFlow360 Core Sales Engine Test Suite', async (t) => {

  await t.test('1. Decimal Calculation Engine Precision', () => {
    // Test that floating point imprecision is completely avoided
    const line = {
      quantity: 3,
      unitPrice: '19.99',
      unitCost: '12.50',
      discountPercent: '15.00',
      taxRate: '18.00',
      billingType: 'ONE_TIME',
    };

    const calc = calculateLine(line);

    // subtotal = 3 * 19.99 = 59.97
    assert.equal(calc.lineSubtotal.toFixed(2), '59.97');

    // discount = 59.97 * 15 / 100 = 8.9955 -> 9.00
    assert.equal(calc.discountAmount.toFixed(2), '9.00');

    // taxableAmount = 59.97 - 9.00 = 50.97
    // tax = 50.97 * 18 / 100 = 9.1746 -> 9.17
    assert.equal(calc.taxAmount.toFixed(2), '9.17');

    // total = 59.97 - 9.00 + 9.17 = 60.14
    assert.equal(calc.lineTotal.toFixed(2), '60.14');

    // cost = 3 * 12.50 = 37.50
    assert.equal(calc.lineCost.toFixed(2), '37.50');

    // margin = 60.14 - 37.50 = 22.64
    assert.equal(calc.marginAmount.toFixed(2), '22.64');

    // Quotation aggregation test
    const quoteCalc = calculateQuotation([calc, calc]);
    assert.equal(quoteCalc.totals.subtotal.toFixed(2), '119.94');
    assert.equal(quoteCalc.totals.discountAmount.toFixed(2), '18.00');
    assert.equal(quoteCalc.totals.taxAmount.toFixed(2), '18.34');
    assert.equal(quoteCalc.totals.totalAmount.toFixed(2), '120.28');
    assert.equal(quoteCalc.totals.totalCost.toFixed(2), '75.00');
    assert.equal(quoteCalc.totals.grossMargin.toFixed(2), '45.28');
  });

  await t.test('2. Quotation State Transition Machine', () => {
    // Valid transitions
    assert.doesNotThrow(() => validateTransition('DRAFT', 'PENDING_APPROVAL'));
    assert.doesNotThrow(() => validateTransition('PENDING_APPROVAL', 'APPROVED'));
    assert.doesNotThrow(() => validateTransition('APPROVED', 'CUSTOMER_CONFIRMED'));
    assert.doesNotThrow(() => validateTransition('CUSTOMER_CONFIRMED', 'ORDER_CONFIRMED'));

    // Invalid arbitrary status jump
    assert.throws(
      () => validateTransition('DRAFT', 'ORDER_CONFIRMED'),
      /Invalid quotation status transition/
    );

    // Assert editable state
    assert.doesNotThrow(() => assertEditable('DRAFT'));
    assert.doesNotThrow(() => assertEditable('NEGOTIATION'));
    assert.throws(
      () => assertEditable('APPROVED'),
      /cannot be modified/
    );
  });

  await t.test('3. Risk Calculation Engine', () => {
    // Low risk: no discount excess, standard margin
    const lowRisk = calculateRisk({
      maxExcess: 0,
      totalAmount: 5000,
      grossMarginPercent: 35,
      violatingLineCount: 0,
    });
    assert.equal(lowRisk.riskLevel, 'LOW');
    assert.equal(lowRisk.approvalRequired, false);

    // High risk: 8% excess on Services
    const highRisk = calculateRisk({
      maxExcess: 8,
      totalAmount: 15000,
      grossMarginPercent: 28,
      violatingLineCount: 1,
      violatingCategories: ['Services'],
      customerTierName: 'GOLD',
    });
    assert.equal(highRisk.riskLevel, 'HIGH');
    assert.equal(highRisk.approvalRequired, true);
    assert.deepEqual(highRisk.requiredRoles, ['SALES_MANAGER', 'FINANCE']);
  });

  await t.test('4. Scenario 16 Full End-to-End Workflow', async () => {
    // Fetch seed data
    const goldCustomer = await prisma.customer.findFirst({
      where: { name: 'Acme Corp' },
      include: { tier: true },
    });
    assert.ok(goldCustomer, 'Acme Corp exists');
    assert.equal(goldCustomer.tier?.name, 'GOLD');

    const laptop = await prisma.product.findUnique({ where: { sku: 'HW-LAPTOP-001' } });
    const officeSetup = await prisma.product.findUnique({ where: { sku: 'SV-SETUP-001' } });
    assert.ok(laptop, 'Laptop product exists');
    assert.ok(officeSetup, 'Office Setup Service product exists');

    const salesRepUser = await prisma.user.findFirst({ where: { role: 'SALES_REP' } });
    const managerUser = await prisma.user.findFirst({ where: { role: 'SALES_MANAGER' } });
    const financeUser = await prisma.user.findFirst({ where: { role: 'FINANCE' } });
    const customerUser = await prisma.user.findFirst({ where: { role: 'CUSTOMER', email: 'customer@dealflow360.com' } });
    if (customerUser) {
      customerUser.customerId = goldCustomer.id;
      customerUser.customer_id = goldCustomer.id;
    }

    assert.ok(salesRepUser, 'Sales rep demo user exists');
    assert.ok(managerUser, 'Manager demo user exists');
    assert.ok(financeUser, 'Finance demo user exists');
    assert.ok(customerUser, 'Customer demo user exists');

    // A. Create Quotation:
    // Laptop x 10 with 12% discount
    // Office Setup Service x 1 with 18% discount
    const quote = await quotationsService.create(
      {
        customerId: goldCustomer.id,
        salesRepId: salesRepUser.id,
        lines: [
          {
            productId: laptop.id,
            quantity: 10,
            unitPrice: 1200,
            unitCost: 800,
            discountPercent: 12,
            taxRate: 18,
          },
          {
            productId: officeSetup.id,
            quantity: 1,
            unitPrice: 500,
            unitCost: 250,
            discountPercent: 18,
            taxRate: 18,
          },
        ],
      },
      salesRepUser
    );

    assert.ok(quote.id, 'Quote created');
    assert.equal(quote.status, 'DRAFT');

    // B. Run POST /api/quotations/:id/discount-check
    const discountCheck = await checkQuotationDiscounts(quote.id);

    // Verification of Scenario 16 expectations:
    // Gold allows up to 15%. Services allows up to 10%.
    // Service discount = 18%. Excess = 18% - 10% = 8% excess!
    assert.equal(discountCheck.excess, 8, 'Backend detects exactly 8% excess');
    assert.equal(discountCheck.allowed, 10, 'Allowed limit is 10%');
    assert.equal(discountCheck.current, 18, 'Current discount is 18%');
    assert.equal(discountCheck.approvalRequired, true, 'Approval required');
    assert.equal(discountCheck.risk, 'HIGH', 'Risk level is HIGH');
    assert.equal(discountCheck.affectedLines.length, 1, '1 affected line');
    assert.equal(discountCheck.affectedLines[0].productName, 'Office Setup Service');

    // C. Submit Quotation for approval: DRAFT -> PENDING_APPROVAL
    const submitResult = await quotationsService.submit(quote.id, salesRepUser);
    assert.equal(submitResult.quotation.status, 'PENDING_APPROVAL');

    // Approval request was created
    const approvalReq = await prisma.approvalRequest.findFirst({
      where: { quotationId: quote.id },
    });
    assert.ok(approvalReq, 'Approval request created');
    assert.equal(approvalReq.status, 'PENDING');
    assert.equal(approvalReq.currentStep, 1);
    assert.equal(approvalReq.totalSteps, 2);
    assert.equal(approvalReq.requiredRole, 'SALES_MANAGER');

    // D. Security Check: Sales Rep cannot approve their own deal
    await assert.rejects(
      approvalsService.approve(approvalReq.id, salesRepUser, 'Self approval attempt'),
      /Sales representatives cannot approve their own quotation/
    );

    // Security Check: Customer cannot approve
    await assert.rejects(
      approvalsService.approve(approvalReq.id, customerUser, 'Customer approval attempt'),
      /Customers cannot approve quotations/
    );

    // Security Check: Finance cannot jump queue to approve step 1 before manager
    await assert.rejects(
      approvalsService.approve(approvalReq.id, financeUser, 'Premature finance approval'),
      /Step 1 requires approval by SALES_MANAGER/
    );

    // E. Sales Manager approves Step 1
    const step1Result = await approvalsService.approve(approvalReq.id, managerUser, 'Manager Step 1 approved');
    assert.equal(step1Result.status, 'STEP_APPROVED');

    // Check that approval request moved to Step 2 for Finance
    const reqAfterStep1 = await prisma.approvalRequest.findUnique({ where: { id: approvalReq.id } });
    assert.equal(reqAfterStep1.currentStep, 2);
    assert.equal(reqAfterStep1.requiredRole, 'FINANCE');

    // Quotation is still PENDING_APPROVAL until Finance approves
    const quoteAfterStep1 = await prisma.quotation.findUnique({ where: { id: quote.id } });
    assert.equal(quoteAfterStep1.status, 'PENDING_APPROVAL');

    // F. Finance approves Step 2
    const step2Result = await approvalsService.approve(approvalReq.id, financeUser, 'Finance Step 2 approved');
    assert.equal(step2Result.status, 'APPROVED');

    // Quotation is now APPROVED
    const approvedQuote = await prisma.quotation.findUnique({ where: { id: quote.id } });
    assert.equal(approvedQuote.status, 'APPROVED');

    // G. Customer confirms Quotation through portal
    const confirmedQuote = await quotationsService.confirm(quote.id, customerUser);
    assert.equal(confirmedQuote.status, 'CUSTOMER_CONFIRMED');

    // H. Verify Audit Logs
    const auditLogs = await listAuditLogs({ entityId: quote.id });
    assert.ok(auditLogs.length >= 4, 'Audit logs recorded for creation, submit, step approvals, confirmation');
    const actions = auditLogs.map(l => l.action);
    assert.ok(actions.includes('QUOTATION_CREATE'));
    assert.ok(actions.includes('QUOTATION_SUBMIT'));
    assert.ok(actions.includes('CUSTOMER_CONFIRMED'));
  });

  await t.test('5. Customer Isolation Security', async () => {
    // Create customer 1 and customer 2
    const cust1 = await prisma.customer.findFirst({ where: { name: 'Acme Corp' } });
    const cust2 = await prisma.customer.findFirst({ where: { name: 'StartupXYZ' } });

    // Mock customer 1 user
    const custUser1 = {
      id: 'cust-user-1',
      email: cust1.email,
      role: 'CUSTOMER',
      customer_id: cust1.id,
    };

    // Customer 1 cannot access Customer 2 record
    await assert.rejects(
      async () => { await customersService.getById(cust2.id, custUser1); },
      /Access denied/
    );

    // Customer 1 cannot access approval queues
    await assert.rejects(
      async () => { await approvalsService.list({ user: custUser1 }); },
      /Access denied/
    );
  });

  await prisma.$disconnect();
});
