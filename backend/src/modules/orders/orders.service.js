'use strict';

const prisma = require('../../database/prisma');
const { AppError } = require('../../utils/errors');
const { logAudit } = require('../../services/audit.service');

exports.createFromQuotation = async (quotationId, user = null) => {
  if (!quotationId) {
    throw new AppError('Quotation ID is required', 400);
  }

  // 1. Fetch quotation with lines and customer
  const quotation = await prisma.quotation.findUnique({
    where: { id: quotationId },
    include: {
      lines: { include: { product: true } },
      customer: true,
      salesRep: true,
    },
  });

  if (!quotation) {
    throw new AppError('Quotation not found', 404);
  }

  // 2. Idempotency Check: Return existing sales order if already converted
  const existingOrder = await prisma.salesOrder.findUnique({
    where: { quotationId },
    include: {
      lines: { include: { product: true } },
      customer: true,
      subscriptions: true,
      fulfillments: true,
      invoices: true,
      backorders: true,
    },
  });

  if (existingOrder) {
    return existingOrder;
  }

  // 3. Strict State Validation: Only CUSTOMER_CONFIRMED can become a Sales Order
  if (quotation.status !== 'CUSTOMER_CONFIRMED') {
    throw new AppError(
      `Cannot create sales order from quotation with status '${quotation.status}'. Quotation must be CUSTOMER_CONFIRMED.`,
      400
    );
  }

  // 4. Customer ownership validation if requested by CUSTOMER role
  if (user && user.role === 'CUSTOMER') {
    const userCustId = user.customerId || user.customer_id;
    const isOwner = userCustId === quotation.customerId ||
      (quotation.customer?.email && quotation.customer.email.toLowerCase() === user.email.toLowerCase());
    if (!isOwner) {
      throw new AppError('Access denied. You do not own this quotation.', 403);
    }
  }

  // 5. Execute transactional sales order creation and recurring line handling
  const salesOrder = await prisma.$transaction(async (tx) => {
    // Generate order number
    const count = await tx.salesOrder.count();
    const orderNumber = `SO-${String(count + 1).padStart(5, '0')}`;

    // Separate recurring products from one-time products
    const recurringLines = quotation.lines.filter(
      (l) => l.billingType === 'RECURRING' ||
             (l.product?.name && (
               l.product.name.toLowerCase().includes('support') ||
               l.product.name.toLowerCase().includes('backup') ||
               l.product.name.toLowerCase().includes('cloud') ||
               l.product.name.toLowerCase().includes('subscription')
             )) ||
             (l.product?.category?.name === 'Software')
    );

    // Create Sales Order and Lines
    const newOrder = await tx.salesOrder.create({
      data: {
        orderNumber,
        quotationId: quotation.id,
        customerId: quotation.customerId,
        status: 'ORDER_CONFIRMED',
        currency: quotation.currency || 'USD',
        subtotal: quotation.subtotal,
        discountAmount: quotation.discountAmount,
        taxAmount: quotation.taxAmount,
        totalAmount: quotation.totalAmount,
        totalCost: quotation.totalCost,
        grossMargin: quotation.grossMargin,
        marginPercentage: quotation.marginPercentage,
        notes: quotation.notes || `Generated from Quotation ${quotation.quotationNumber}`,
        lines: {
          create: quotation.lines.map((l) => ({
            productId: l.productId,
            quantity: l.quantity,
            unitPrice: l.unitPrice,
            unitCost: l.unitCost || 0,
            discountPercent: l.discountPercent || 0,
            discountAmount: l.discountAmount || 0,
            taxRate: l.taxRate || 0,
            lineSubtotal: l.lineSubtotal,
            lineTotal: l.lineTotal,
            quantityReserved: 0,
            quantityFulfilled: 0,
            quantityBackordered: 0,
            billingType: l.billingType || 'ONE_TIME',
          })),
        },
      },
      include: {
        lines: { include: { product: true } },
        customer: true,
      },
    });

    // If quotation has RECURRING lines, automatically create Subscription and Billing Schedules
    if (recurringLines.length > 0) {
      const defaultPlan = await tx.subscriptionPlan.findFirst({
        where: { active: true, interval: 'monthly' },
      }) || await tx.subscriptionPlan.findFirst({ where: { active: true } });

      const subCount = await tx.subscription.count();
      const subscriptionNumber = `SUB-${String(subCount + 1).padStart(5, '0')}`;

      const now = new Date();
      const nextMonth = new Date(now);
      nextMonth.setMonth(nextMonth.getMonth() + 1);

      const subscription = await tx.subscription.create({
        data: {
          subscriptionNumber,
          customerId: quotation.customerId,
          salesOrderId: newOrder.id,
          planId: defaultPlan?.id || null,
          status: 'ACTIVE',
          currency: quotation.currency || 'USD',
          startDate: now,
          nextBillingDate: nextMonth,
          lines: {
            create: recurringLines.map((l) => ({
              productId: l.productId,
              quantity: l.quantity,
              unitPrice: l.unitPrice,
              discountPercent: l.discountPercent || 0,
              taxRate: l.taxRate || 0,
              lineTotal: l.lineTotal,
              billingType: 'RECURRING',
            })),
          },
        },
      });

      // Generate 12-month billing schedules
      const schedulesData = [];
      const totalRecurringAmount = recurringLines.reduce(
        (sum, l) => sum + Number(l.lineTotal),
        0
      );

      for (let i = 0; i < 12; i++) {
        const periodStart = new Date(now);
        periodStart.setMonth(periodStart.getMonth() + i);

        const periodEnd = new Date(periodStart);
        periodEnd.setMonth(periodEnd.getMonth() + 1);

        const dueDate = new Date(periodStart);

        schedulesData.push({
          subscriptionId: subscription.id,
          dueDate,
          periodStart,
          periodEnd,
          amount: totalRecurringAmount,
          status: i === 0 ? 'SCHEDULED' : 'SCHEDULED',
        });
      }

      await tx.billingSchedule.createMany({
        data: schedulesData,
      });
    }

    // Update Quotation status to ORDER_CONFIRMED to track transition
    await tx.quotation.update({
      where: { id: quotation.id },
      data: { status: 'ORDER_CONFIRMED' },
    });

    return newOrder;
  }, { maxWait: 15000, timeout: 60000 });

  // Log Audit
  await logAudit({
    userId: user?.id,
    action: 'SALES_ORDER_CREATED',
    entityType: 'SALES_ORDER',
    entityId: salesOrder.id,
    newValues: {
      orderNumber: salesOrder.orderNumber,
      quotationId: quotation.id,
      totalAmount: salesOrder.totalAmount.toString(),
    },
  });

  // Return complete populated sales order
  return prisma.salesOrder.findUnique({
    where: { id: salesOrder.id },
    include: {
      lines: { include: { product: true } },
      customer: true,
      quotation: true,
      subscriptions: { include: { lines: { include: { product: true } }, billingSchedules: true } },
      fulfillments: true,
      invoices: true,
      backorders: true,
    },
  });
};

exports.list = async ({ user = null, status, customerId, limit = 50, offset = 0 } = {}) => {
  const where = {};

  // Security Scoping
  if (user && user.role === 'CUSTOMER') {
    const userCustId = user.customerId || user.customer_id;
    if (userCustId) {
      where.customerId = userCustId;
    } else {
      const cust = await prisma.customer.findFirst({
        where: { OR: [{ email: user.email }, { ownerId: user.id }] },
      });
      if (cust) where.customerId = cust.id;
      else return [];
    }
  } else if (user && user.role === 'SALES_REP') {
    where.quotation = {
      OR: [
        { salesRepId: user.id },
        { customer: { salesRepId: user.id } },
      ],
    };
  } else if (customerId) {
    where.customerId = customerId;
  }

  if (status) {
    where.status = status;
  }

  return prisma.salesOrder.findMany({
    where,
    include: {
      customer: { select: { id: true, name: true, company: true, email: true } },
      lines: { include: { product: { select: { id: true, name: true, sku: true } } } },
      quotation: { select: { id: true, quotationNumber: true } },
      fulfillments: { select: { id: true, orderNumber: true, status: true } },
      invoices: { select: { id: true, invoiceNumber: true, status: true, totalAmount: true, balanceDue: true } },
      backorders: { select: { id: true, quantity: true, status: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: Number(limit),
    skip: Number(offset),
  });
};

exports.getById = async (id, user = null) => {
  const order = await prisma.salesOrder.findUnique({
    where: { id },
    include: {
      customer: true,
      quotation: {
        include: {
          salesRep: { select: { id: true, name: true, email: true } },
        },
      },
      lines: {
        include: { product: true },
        orderBy: { createdAt: 'asc' },
      },
      fulfillments: {
        include: {
          warehouse: true,
          lines: { include: { product: true } },
        },
      },
      invoices: {
        include: {
          payments: true,
          lines: true,
        },
      },
      subscriptions: {
        include: {
          plan: true,
          lines: { include: { product: true } },
          billingSchedules: { orderBy: { dueDate: 'asc' } },
        },
      },
      backorders: {
        include: { product: true },
      },
    },
  });

  if (!order) {
    throw new AppError('Sales order not found', 404);
  }

  // Security Scoping
  if (user && user.role === 'CUSTOMER') {
    const userCustId = user.customerId || user.customer_id;
    const isOwner = userCustId === order.customerId ||
      (order.customer?.email && order.customer.email.toLowerCase() === user.email.toLowerCase());
    if (!isOwner) {
      throw new AppError('Access denied to this sales order.', 403);
    }
  }

  return order;
};

exports.confirm = async (id, user = null) => {
  const order = await prisma.salesOrder.findUnique({ where: { id } });
  if (!order) throw new AppError('Sales order not found', 404);

  const updated = await prisma.salesOrder.update({
    where: { id },
    data: { status: 'ORDER_CONFIRMED' },
    include: { lines: true, customer: true },
  });

  await logAudit({
    userId: user?.id,
    action: 'SALES_ORDER_CONFIRMED',
    entityType: 'SALES_ORDER',
    entityId: id,
    oldValues: { status: order.status },
    newValues: { status: 'ORDER_CONFIRMED' },
  });

  return updated;
};

exports.cancel = async (id, user = null, reason = '') => {
  const order = await prisma.salesOrder.findUnique({
    where: { id },
    include: { lines: true },
  });
  if (!order) throw new AppError('Sales order not found', 404);

  // Transactionally release any reserved stock
  const updated = await prisma.$transaction(async (tx) => {
    // Release reservations
    for (const line of order.lines) {
      if (line.quantityReserved > 0) {
        // Find warehouse stock with reserved quantity and decrement
        const stocks = await tx.warehouseStock.findMany({
          where: { productId: line.productId, reservedQty: { gt: 0 } },
        });
        for (const stock of stocks) {
          const toRelease = Math.min(stock.reservedQty, line.quantityReserved);
          if (toRelease > 0) {
            await tx.warehouseStock.update({
              where: { id: stock.id },
              data: { reservedQty: { decrement: toRelease } },
            });
          }
        }
      }
    }

    // Cancel backorders
    await tx.backorder.updateMany({
      where: { salesOrderId: id, status: 'PENDING' },
      data: { status: 'CANCELLED' },
    });

    return tx.salesOrder.update({
      where: { id },
      data: { status: 'CANCELLED', notes: reason ? `${order.notes || ''} [Cancelled: ${reason}]` : order.notes },
      include: { lines: true, customer: true },
    });
  }, { maxWait: 15000, timeout: 60000 });

  await logAudit({
    userId: user?.id,
    action: 'SALES_ORDER_CANCELLED',
    entityType: 'SALES_ORDER',
    entityId: id,
    oldValues: { status: order.status },
    newValues: { status: 'CANCELLED', reason },
  });

  return updated;
};

exports.createOrderFromQuotation = exports.createFromQuotation;
exports.getOrderById = exports.getById;
exports.listOrders = exports.list;
