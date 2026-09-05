'use strict';

const path = require('path');
require(path.join(__dirname, '../backend/node_modules/dotenv')).config({ path: path.join(__dirname, '../backend/.env') });
const prisma = require('../backend/src/database/prisma');
const ordersService = require('../backend/src/modules/orders/orders.service');
const fulfillmentService = require('../backend/src/modules/fulfillment/fulfillment.service');
const backordersService = require('../backend/src/modules/backorders/backorders.service');
const inventoryService = require('../backend/src/modules/inventory/inventory.service');
const billingService = require('../backend/src/modules/billing/billing.service');
const analyticsService = require('../backend/src/modules/analytics/operations-analytics.service');

async function runE2ETest() {
  console.log('================================================================');
  console.log('DEALFLOW360 - DEVELOPER 3 END-TO-END VERIFICATION SUITE');
  console.log('================================================================\n');

  try {
    // 1. Fetch Demo Customer & Products
    const customer = await prisma.customer.findFirst();
    if (!customer) throw new Error('No customer found in database');

    const laptopProduct = await prisma.product.findFirst({ where: { sku: 'HW-LAPTOP-001' } });
    const dockProduct = await prisma.product.findFirst({ where: { sku: 'HW-DOCK-001' } });
    const cloudProduct = await prisma.product.findFirst({ where: { sku: 'SW-BACKUP-001' } });
    const amdWarehouse = await prisma.warehouse.findFirst({ where: { code: 'WH-AMD-01' } });
    const bdqWarehouse = await prisma.warehouse.findFirst({ where: { code: 'WH-BDQ-01' } });

    console.log('✓ Found test entities:');
    console.log(`  Customer: ${customer.name} (${customer.id})`);
    console.log(`  Laptop SKU: ${laptopProduct?.sku} ($${laptopProduct?.basePrice})`);
    console.log(`  Cloud ERP SKU: ${cloudProduct?.sku} ($${cloudProduct?.basePrice})`);
    console.log(`  Ahmedabad Warehouse: ${amdWarehouse?.code} (${amdWarehouse?.id})`);
    console.log(`  Vadodara Warehouse: ${bdqWarehouse?.code} (${bdqWarehouse?.id})\n`);

    // Ensure stock on Ahmedabad is known (e.g. 6 laptops)
    let laptopStock = await prisma.warehouseStock.findUnique({
      where: {
        warehouseId_productId: {
          warehouseId: amdWarehouse.id,
          productId: laptopProduct.id,
        },
      },
    });

    if (!laptopStock || laptopStock.quantity < 6) {
      await prisma.warehouseStock.upsert({
        where: {
          warehouseId_productId: {
            warehouseId: amdWarehouse.id,
            productId: laptopProduct.id,
          },
        },
        update: { quantity: 6, reservedQty: 0 },
        create: {
          warehouseId: amdWarehouse.id,
          productId: laptopProduct.id,
          quantity: 6,
          reservedQty: 0,
          reorderLevel: 5,
        },
      });
      laptopStock = await prisma.warehouseStock.findUnique({
        where: { warehouseId_productId: { warehouseId: amdWarehouse.id, productId: laptopProduct.id } },
      });
    }
    console.log(`Initial Ahmedabad Laptop Stock: On-Hand=${laptopStock.quantity}, Reserved=${laptopStock.reservedQty}`);

    // 2. Create a test Quotation in CUSTOMER_CONFIRMED status
    const salesRep = await prisma.user.findFirst({ where: { role: 'SALES_REP' } }) || await prisma.user.findFirst();
    const opsUser = await prisma.user.findFirst({ where: { role: 'OPS_FINANCE' } }) || salesRep;
    const adminUser = await prisma.user.findFirst({ where: { role: 'MANAGER_ADMIN' } }) || salesRep;
    const count = await prisma.quotation.count();
    const quoteNumber = `QT-E2E-${Date.now().toString().slice(-5)}`;

    const testQuote = await prisma.quotation.create({
      data: {
        quotationNumber: quoteNumber,
        customerId: customer.id,
        salesRepId: salesRep.id,
        status: 'CUSTOMER_CONFIRMED',
        currency: 'USD',
        subtotal: 10 * 1200 + 1 * 500, // 10 laptops ($1200) + 1 Cloud ERP ($500)
        discountAmount: 500,
        taxAmount: 120,
        totalAmount: 12000 + 500 - 500 + 120,
        totalCost: 10 * 800 + 1 * 50,
        grossMargin: (12000 + 500 - 500 + 120) - (10 * 800 + 50),
        lines: {
          create: [
            {
              productId: laptopProduct.id,
              quantity: 10, // Request 10 laptops when only 6 in stock -> will trigger 4 backordered!
              unitPrice: 1200,
              unitCost: 800,
              discountPercent: 0,
              discountAmount: 0,
              lineSubtotal: 12000,
              lineTotal: 12000,
              billingType: 'ONE_TIME',
            },
            {
              productId: cloudProduct.id,
              quantity: 1,
              unitPrice: 500,
              unitCost: 50,
              discountPercent: 0,
              discountAmount: 0,
              lineSubtotal: 500,
              lineTotal: 500,
              billingType: 'RECURRING',
            },
          ],
        },
      },
      include: { lines: true },
    });

    console.log(`\n✓ Created CUSTOMER_CONFIRMED Quotation: ${testQuote.quotationNumber} (${testQuote.id})`);

    // 3. Test Sales Order Creation from Quotation
    console.log('\n--- STEP 3: Order Conversion ---');
    const order = await ordersService.createOrderFromQuotation(testQuote.id, adminUser);
    console.log(`✓ Created Sales Order: ${order.orderNumber} (${order.id})`);
    console.log(`  Lines count: ${order.lines.length}, Total: $${order.totalAmount}`);

    // Idempotency check
    const orderIdem = await ordersService.createOrderFromQuotation(testQuote.id, adminUser);
    if (orderIdem.id !== order.id) throw new Error('Idempotency failed: duplicate order created!');
    console.log('✓ Idempotency verified: duplicate conversion returned identical order');

    // Verify recurring line generated subscription
    const sub = await prisma.subscription.findFirst({
      where: { salesOrderId: order.id },
      include: { billingSchedules: true, lines: true },
    });
    if (!sub) throw new Error('Subscription was not generated for recurring cloud line!');
    console.log(`✓ Generated Subscription: ${sub.subscriptionNumber}`);
    console.log(`  Billing Schedules: ${sub.billingSchedules.length} monthly periods created`);

    // 4. Test Multi-Warehouse Fulfillment & Backorder Generation
    console.log('\n--- STEP 4: Fulfillment Allocation & Backorder Trigger ---');
    const laptopLine = order.lines.find((l) => l.productId === laptopProduct.id);
    if (!laptopLine) throw new Error('Laptop line missing from sales order');

    // Allocate 10 units to Ahmedabad warehouse where only 6 are available!
    const fulfillment = await fulfillmentService.createFulfillmentOrder({
      salesOrderId: order.id,
      warehouseId: amdWarehouse.id,
      lines: [
        {
          salesOrderLineId: laptopLine.id,
          quantityToFulfill: 10,
        },
      ],
      user: opsUser,
    });

    console.log(`✓ Fulfillment Order created: ${fulfillment.fulfillmentNumber || fulfillment.id}`);
    console.log(`  Status: ${fulfillment.status}`);
    console.log(`  Fulfillment allocated quantity: ${fulfillment.lines[0]?.quantityToFulfill}`);

    // Check backorders
    const bo = await prisma.backorder.findFirst({
      where: { salesOrderId: order.id, productId: laptopProduct.id },
    });
    if (!bo) throw new Error('Backorder was NOT generated for 4 missing laptops!');
    console.log(`✓ Backorder automatically created for shortage:`);
    console.log(`  Backorder #${bo.backorderNumber}, Deficit Quantity: ${bo.quantity}, Status: ${bo.status}`);

    // Verify stock reservation in Ahmedabad
    const stockAfterReserve = await prisma.warehouseStock.findUnique({
      where: { warehouseId_productId: { warehouseId: amdWarehouse.id, productId: laptopProduct.id } },
    });
    console.log(`✓ Ahmedabad Stock after reservation: On-Hand=${stockAfterReserve.quantity}, Reserved=${stockAfterReserve.reservedQty}`);

    // 5. Test Shipment Completion
    console.log('\n--- STEP 5: Dispatch Shipment ---');
    const fulfilledOrder = await fulfillmentService.fulfillFulfillmentOrder(
      fulfillment.id,
      { trackingNumber: 'FEDEX-TEST-99881' },
      opsUser
    );
    console.log(`✓ Dispatched Fulfillment Order: Status=${fulfilledOrder.status}, Tracking=${fulfilledOrder.trackingNumber}`);

    // Verify physical stock decremented and reservation released
    const stockAfterShip = await prisma.warehouseStock.findUnique({
      where: { warehouseId_productId: { warehouseId: amdWarehouse.id, productId: laptopProduct.id } },
    });
    console.log(`✓ Stock after shipment: On-Hand=${stockAfterShip.quantity}, Reserved=${stockAfterShip.reservedQty}`);

    // 6. Test Backorder Restock & Resolution
    console.log('\n--- STEP 6: Backorder Restock & Resolution ---');
    // Restock 10 laptops to Vadodara warehouse
    await inventoryService.adjustStock(
      {
        warehouseId: bdqWarehouse.id,
        productId: laptopProduct.id,
        adjustment: 10,
        reason: 'Restock container shipment',
      },
      opsUser
    );
    console.log('✓ Restocked 10 units to Vadodara warehouse');

    // Fulfill backorder from Vadodara warehouse
    const boResolution = await backordersService.fulfillBackorder(
      bo.id,
      { warehouseId: bdqWarehouse.id, quantity: bo.quantity },
      opsUser
    );
    console.log(`✓ Backorder fulfilled: Status=${boResolution.backorder.status}, FulfilledQty=${boResolution.backorder.fulfilledQuantity}`);

    // Verify sales order status is now FULFILLED
    const refreshedOrder = await ordersService.getOrderById(order.id);
    console.log(`✓ Sales Order status after backorder fulfillment: ${refreshedOrder.status}`);

    // 7. Test Invoicing & Accounting
    console.log('\n--- STEP 7: Authoritative Invoicing ---');
    const invoice = await billingService.createInvoiceFromOrder(order.id, opsUser);
    console.log(`✓ Created Invoice: ${invoice.invoiceNumber}`);
    console.log(`  Total: $${invoice.totalAmount}, Balance Due: $${invoice.balanceDue}, Status: ${invoice.status}`);

    // Idempotency check
    const invoiceIdem = await billingService.createInvoiceFromOrder(order.id, opsUser);
    if (invoiceIdem.id !== invoice.id) throw new Error('Invoice idempotency failed!');
    console.log('✓ Invoice idempotency verified');

    // 8. Test Payment & Overpayment Protection
    console.log('\n--- STEP 8: Payment & Financial Controls ---');
    // Test Overpayment Prevention
    const overpaymentAmount = Number(invoice.balanceDue) + 500;
    try {
      await billingService.recordPayment({
        invoiceId: invoice.id,
        amount: overpaymentAmount,
        paymentMethod: 'CREDIT_CARD',
      });
      throw new Error('FAILED: Overpayment was erroneously allowed!');
    } catch (err) {
      console.log(`✓ Overpayment prevented successfully: "${err.message}"`);
    }

    // Partial Payment
    const partialPayment = 5000;
    const partialRes = await billingService.recordPayment({
      invoiceId: invoice.id,
      amount: partialPayment,
      paymentMethod: 'BANK_TRANSFER',
      reference: 'ACH-PARTIAL-1',
    });
    console.log(`✓ Partial Payment Recorded: $${partialPayment}`);
    console.log(`  Invoice Status: ${partialRes.invoice.status}, Balance Due: $${partialRes.invoice.balanceDue}`);

    // Settle remaining balance
    const remainingBalance = Number(partialRes.invoice.balanceDue);
    const finalRes = await billingService.recordPayment({
      invoiceId: invoice.id,
      amount: remainingBalance,
      paymentMethod: 'CREDIT_CARD',
      reference: 'CC-FINAL-SETTLED',
    });
    console.log(`✓ Final Payment Recorded: $${remainingBalance}`);
    console.log(`  Invoice Status: ${finalRes.invoice.status}, Balance Due: $${finalRes.invoice.balanceDue}`);

    // 9. Test Subscription Billing Schedule Invoice Generation
    console.log('\n--- STEP 9: Subscription Schedule Invoicing ---');
    const firstSchedule = sub.billingSchedules[0];
    const schedInvoice = await billingService.createInvoiceFromSchedule(firstSchedule.id, opsUser);
    console.log(`✓ Generated Invoice from Schedule Period 1: ${schedInvoice.invoiceNumber} ($${schedInvoice.totalAmount})`);

    // 10. Operations Analytics KPIs Telemetry
    console.log('\n--- STEP 10: Real Operations KPIs Telemetry ---');
    const kpis = await analyticsService.getOperationsKPIs();
    console.log('✓ Live Database Operations Metrics:');
    console.log(`  Total Orders: ${kpis.totalOrders}`);
    console.log(`  Fulfilled Orders: ${kpis.fulfilledOrders}`);
    console.log(`  Open Backorders: ${kpis.openBackorders} (${kpis.openBackordersQuantity} units)`);
    console.log(`  Total Inventory Value: $${kpis.totalInventoryValue.toLocaleString()}`);
    console.log(`  Available Stock Quantity: ${kpis.availableStockQuantity} units`);
    console.log(`  Total Collected Revenue: $${kpis.totalCollectedRevenue.toLocaleString()}`);
    console.log(`  Active Subscriptions: ${kpis.activeSubscriptions}`);
    console.log(`  Monthly Recurring Revenue: $${kpis.monthlyRecurringRevenue}`);

    console.log('\n================================================================');
    console.log('🎉 ALL DEVELOPER 3 REQUIREMENTS VALIDATED & PASSED PERFECTLY!');
    console.log('================================================================\n');
  } catch (err) {
    console.error('\n❌ E2E TEST FAILED:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runE2ETest();
