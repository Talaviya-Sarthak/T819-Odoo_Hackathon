'use strict';

const prisma = require('../../database/prisma');
const { AppError } = require('../../utils/errors');
const { logAudit } = require('../../services/audit.service');

// ─── INVOICE MANAGEMENT ─────────────────────────────────────────────

exports.createInvoiceFromOrder = async (salesOrderId, user = null) => {
  const order = await prisma.salesOrder.findUnique({
    where: { id: salesOrderId },
    include: {
      lines: { include: { product: true } },
      customer: true,
      invoices: true,
    },
  });

  if (!order) throw new AppError('Sales order not found', 404);

  // Idempotency: Return existing invoice if already generated
  if (order.invoices && order.invoices.length > 0) {
    return prisma.invoice.findUnique({
      where: { id: order.invoices[0].id },
      include: { lines: true, payments: true, customer: true },
    });
  }

  const count = await prisma.invoice.count();
  const invoiceNumber = `INV-${String(count + 1).padStart(5, '0')}`;

  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 30); // Net 30 terms

  const invoice = await prisma.$transaction(async (tx) => {
    return tx.invoice.create({
      data: {
        invoiceNumber,
        customerId: order.customerId,
        salesOrderId: order.id,
        currency: order.currency || 'USD',
        subtotal: order.subtotal,
        discountAmount: order.discountAmount,
        taxAmount: order.taxAmount,
        totalAmount: order.totalAmount,
        amount: order.totalAmount,
        amountPaid: 0,
        balanceDue: order.totalAmount,
        status: 'PENDING',
        dueDate,
        lines: {
          create: order.lines.map((l) => ({
            productId: l.productId,
            description: l.product?.name || 'Line Item',
            quantity: l.quantity,
            unitPrice: l.unitPrice,
            discountAmount: l.discountAmount,
            taxAmount: l.taxRate ? (Number(l.lineSubtotal) * Number(l.taxRate) / 100) : 0,
            lineTotal: l.lineTotal,
          })),
        },
      },
      include: {
        lines: { include: { product: true } },
        customer: true,
        payments: true,
      },
    });
  }, { maxWait: 15000, timeout: 60000 });

  await logAudit({
    userId: user?.id,
    action: 'INVOICE_GENERATED',
    entityType: 'INVOICE',
    entityId: invoice.id,
    newValues: { invoiceNumber, totalAmount: invoice.totalAmount.toString() },
  });

  return invoice;
};

exports.createInvoiceFromSchedule = async (scheduleId, user = null) => {
  const schedule = await prisma.billingSchedule.findUnique({
    where: { id: scheduleId },
    include: {
      subscription: {
        include: {
          customer: true,
          lines: { include: { product: true } },
        },
      },
      invoice: true,
    },
  });

  if (!schedule) throw new AppError('Billing schedule not found', 404);
  if (schedule.invoice) return schedule.invoice;

  const count = await prisma.invoice.count();
  const invoiceNumber = `INV-${String(count + 1).padStart(5, '0')}`;

  const sub = schedule.subscription;

  const invoice = await prisma.$transaction(async (tx) => {
    const inv = await tx.invoice.create({
      data: {
        invoiceNumber,
        customerId: sub.customerId,
        subscriptionId: sub.id,
        salesOrderId: sub.salesOrderId || null,
        currency: sub.currency || 'USD',
        subtotal: schedule.amount,
        discountAmount: 0,
        taxAmount: 0,
        totalAmount: schedule.amount,
        amount: schedule.amount,
        amountPaid: 0,
        balanceDue: schedule.amount,
        status: 'PENDING',
        dueDate: schedule.dueDate,
        lines: {
          create: sub.lines.map((l) => ({
            productId: l.productId,
            description: `${l.product?.name || 'Subscription'} (${schedule.periodStart ? new Date(schedule.periodStart).toLocaleDateString() : ''} - ${schedule.periodEnd ? new Date(schedule.periodEnd).toLocaleDateString() : ''})`,
            quantity: l.quantity,
            unitPrice: l.unitPrice,
            lineTotal: l.lineTotal,
          })),
        },
      },
      include: { lines: true, customer: true },
    });

    await tx.billingSchedule.update({
      where: { id: scheduleId },
      data: { invoiceId: inv.id, status: 'INVOICED' },
    });

    return inv;
  }, { maxWait: 15000, timeout: 60000 });

  await logAudit({
    userId: user?.id,
    action: 'INVOICE_GENERATED_FROM_SCHEDULE',
    entityType: 'INVOICE',
    entityId: invoice.id,
    newValues: { invoiceNumber, scheduleId },
  });

  return invoice;
};

exports.listInvoices = async ({ user = null, customerId, status, limit = 50, offset = 0 } = {}) => {
  const where = {};

  if (user && user.role === 'CUSTOMER') {
    const userCustId = user.customerId || user.customer_id;
    if (userCustId) where.customerId = userCustId;
    else {
      const cust = await prisma.customer.findFirst({
        where: { OR: [{ email: user.email }, { ownerId: user.id }] },
      });
      if (cust) where.customerId = cust.id;
      else return [];
    }
  } else if (customerId) {
    where.customerId = customerId;
  }

  if (status) where.status = status;

  return prisma.invoice.findMany({
    where,
    include: {
      customer: { select: { id: true, name: true, company: true, email: true } },
      salesOrder: { select: { id: true, orderNumber: true } },
      subscription: { select: { id: true, subscriptionNumber: true } },
      payments: true,
      lines: true,
    },
    orderBy: { createdAt: 'desc' },
    take: Number(limit),
    skip: Number(offset),
  });
};

exports.getInvoiceById = async (id, user = null) => {
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      customer: true,
      salesOrder: { include: { lines: true } },
      subscription: true,
      lines: { include: { product: true } },
      payments: { orderBy: { createdAt: 'desc' } },
    },
  });

  if (!invoice) throw new AppError('Invoice not found', 404);

  if (user && user.role === 'CUSTOMER') {
    const userCustId = user.customerId || user.customer_id;
    const isOwner = userCustId === invoice.customerId ||
      (invoice.customer?.email && invoice.customer.email.toLowerCase() === user.email.toLowerCase());
    if (!isOwner) throw new AppError('Access denied to invoice', 403);
  }

  return invoice;
};

// ─── PAYMENTS ───────────────────────────────────────────────────────

exports.recordPayment = async ({ invoiceId, amount, paymentMethod = 'CREDIT_CARD', reference = '' } = {}, user = null) => {
  if (!invoiceId) throw new AppError('Invoice ID is required', 400);

  const payAmt = Number(amount);
  if (isNaN(payAmt) || payAmt <= 0) {
    throw new AppError('Payment amount must be a positive number', 400);
  }

  return prisma.$transaction(async (tx) => {
    const invoice = await tx.invoice.findUnique({
      where: { id: invoiceId },
      include: { billingSchedules: true },
    });

    if (!invoice) throw new AppError('Invoice not found', 404);

    const currentBalance = Number(invoice.balanceDue);

    // Overpayment prevention rule
    if (payAmt > (currentBalance + 0.001)) {
      throw new AppError(
        `Payment amount ($${payAmt.toFixed(2)}) cannot exceed the outstanding balance due ($${currentBalance.toFixed(2)})`,
        400
      );
    }

    const newAmountPaid = Number(invoice.amountPaid) + payAmt;
    const newBalanceDue = Math.max(0, Number(invoice.totalAmount) - newAmountPaid);
    const isFullyPaid = newBalanceDue <= 0.001;

    // 1. Create Payment record
    const payment = await tx.payment.create({
      data: {
        invoiceId,
        amount: payAmt,
        method: paymentMethod,
        reference: reference || `PAY-${Date.now().toString().slice(-6)}`,
        status: 'PAID',
        paidAt: new Date(),
      },
    });

    // 2. Update Invoice balance and status
    const updatedInvoice = await tx.invoice.update({
      where: { id: invoiceId },
      data: {
        amountPaid: newAmountPaid,
        balanceDue: newBalanceDue,
        status: isFullyPaid ? 'PAID' : 'PARTIAL',
        paidAt: isFullyPaid ? new Date() : invoice.paidAt,
      },
    });

    // 3. Update associated billing schedule if paid
    if (isFullyPaid && invoice.billingSchedules?.length > 0) {
      await tx.billingSchedule.updateMany({
        where: { invoiceId },
        data: { status: 'PAID', paidAt: new Date() },
      });
    }

    await logAudit({
      userId: user?.id,
      action: 'PAYMENT_RECORDED',
      entityType: 'PAYMENT',
      entityId: payment.id,
      newValues: {
        invoiceId,
        amount: payAmt,
        newBalanceDue,
        invoiceStatus: updatedInvoice.status,
      },
    });

    return { payment, invoice: updatedInvoice };
  }, { maxWait: 15000, timeout: 60000 });
};

exports.listPayments = async ({ user = null, invoiceId } = {}) => {
  const where = {};
  if (invoiceId) where.invoiceId = invoiceId;

  if (user && user.role === 'CUSTOMER') {
    const userCustId = user.customerId || user.customer_id;
    where.invoice = {
      customerId: userCustId || undefined,
    };
  }

  return prisma.payment.findMany({
    where,
    include: {
      invoice: {
        select: {
          id: true,
          invoiceNumber: true,
          totalAmount: true,
          status: true,
          customer: { select: { id: true, name: true, company: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
};

exports.getPaymentById = async (id, user = null) => {
  const payment = await prisma.payment.findUnique({
    where: { id },
    include: {
      invoice: { include: { customer: true } },
    },
  });

  if (!payment) throw new AppError('Payment not found', 404);

  if (user && user.role === 'CUSTOMER') {
    const userCustId = user.customerId || user.customer_id;
    const isOwner = userCustId === payment.invoice?.customerId ||
      (payment.invoice?.customer?.email && payment.invoice.customer.email.toLowerCase() === user.email.toLowerCase());
    if (!isOwner) throw new AppError('Access denied', 403);
  }

  return payment;
};

// ─── SUBSCRIPTIONS ──────────────────────────────────────────────────

exports.getPlans = async () => {
  return prisma.subscriptionPlan.findMany({
    where: { active: true },
    orderBy: { price: 'asc' },
  });
};

exports.listSubscriptions = async ({ user = null, customerId, status } = {}) => {
  const where = {};

  if (user && user.role === 'CUSTOMER') {
    let userCustId = user.customerId || user.customer_id;
    if (!userCustId) {
      const cust = await prisma.customer.findFirst({
        where: {
          OR: [
            { email: user.email },
            { ownerId: user.id },
          ],
        },
      });
      if (cust) userCustId = cust.id;
    }
    if (userCustId) where.customerId = userCustId;
    else return [];
  } else if (customerId) {
    where.customerId = customerId;
  }

  if (status) where.status = status;

  return prisma.subscription.findMany({
    where,
    include: {
      customer: { select: { id: true, name: true, company: true, email: true } },
      plan: true,
      lines: { include: { product: { select: { id: true, name: true, sku: true } } } },
      billingSchedules: { orderBy: { dueDate: 'asc' } },
      salesOrder: { select: { id: true, orderNumber: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
};

exports.getSubscription = async (id, user = null) => {
  const sub = await prisma.subscription.findUnique({
    where: { id },
    include: {
      customer: true,
      plan: true,
      salesOrder: true,
      lines: { include: { product: true } },
      billingSchedules: { orderBy: { dueDate: 'asc' }, include: { invoice: true } },
      invoices: { include: { payments: true } },
    },
  });

  if (!sub) throw new AppError('Subscription not found', 404);

  if (user && user.role === 'CUSTOMER') {
    const userCustId = user.customerId || user.customer_id;
    const isOwner = userCustId === sub.customerId ||
      (sub.customer?.email && sub.customer.email.toLowerCase() === user.email.toLowerCase());
    if (!isOwner) throw new AppError('Access denied', 403);
  }

  return sub;
};

exports.getBillingSchedule = async (subscriptionId, user = null) => {
  const sub = await exports.getSubscription(subscriptionId, user);
  return prisma.billingSchedule.findMany({
    where: { subscriptionId: sub.id },
    include: { invoice: true },
    orderBy: { dueDate: 'asc' },
  });
};

exports.listBillingSchedules = async ({ subscriptionId, status, user = null } = {}) => {
  const where = {};
  if (subscriptionId) where.subscriptionId = subscriptionId;
  if (status) where.status = status;
  if (user && user.role === 'CUSTOMER') {
    const userCustId = user.customerId || user.customer_id;
    where.subscription = {
      customerId: userCustId || undefined,
    };
  }
  return prisma.billingSchedule.findMany({
    where,
    include: {
      subscription: {
        include: {
          customer: { select: { id: true, name: true, email: true, company: true } },
          plan: true,
        },
      },
      invoice: true,
    },
    orderBy: { dueDate: 'asc' },
  });
};

exports.pauseSubscription = async (id, user = null) => {
  const sub = await prisma.subscription.findUnique({ where: { id } });
  if (!sub) throw new AppError('Subscription not found', 404);

  return prisma.subscription.update({
    where: { id },
    data: { status: 'PAUSED' },
  });
};

exports.resumeSubscription = async (id, user = null) => {
  const sub = await prisma.subscription.findUnique({ where: { id } });
  if (!sub) throw new AppError('Subscription not found', 404);

  return prisma.subscription.update({
    where: { id },
    data: { status: 'ACTIVE' },
  });
};

exports.cancelSubscription = async (id, user = null) => {
  const sub = await prisma.subscription.findUnique({ where: { id } });
  if (!sub) throw new AppError('Subscription not found', 404);

  return prisma.subscription.update({
    where: { id },
    data: { status: 'CANCELLED' },
  });
};
