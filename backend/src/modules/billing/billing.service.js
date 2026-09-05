'use strict';

const { PrismaClient } = require('@prisma/client');
const { AppError } = require('../../utils/errors');

const prisma = new PrismaClient();

exports.getQuotationBilling = async (quotationId) => {
  const quotation = await prisma.quotation.findUnique({
    where: { id: quotationId },
    include: {
      invoices: { include: { payments: true } },
      subscriptions: true,
    },
  });
  if (!quotation) throw new AppError('Quotation not found', 404);
  return quotation;
};

exports.getSubscription = async (id) => {
  const subscription = await prisma.subscription.findUnique({
    where: { id },
    include: {
      customer: true,
      plan: true,
      lines: { include: { product: true } },
      billingSchedules: { orderBy: { billingDate: 'asc' } },
    },
  });
  if (!subscription) throw new AppError('Subscription not found', 404);
  return subscription;
};

exports.getBillingSchedule = async (subscriptionId) => {
  const subscription = await prisma.subscription.findUnique({ where: { id: subscriptionId } });
  if (!subscription) throw new AppError('Subscription not found', 404);

  return prisma.billingSchedule.findMany({
    where: { subscriptionId },
    include: { invoice: true },
    orderBy: { billingDate: 'asc' },
  });
};

exports.createSubscription = async (data) => {
  return prisma.subscription.create({
    data,
    include: { customer: true, plan: true, lines: true },
  });
};

exports.createInvoice = async (data) => {
  const count = await prisma.invoice.count();
  const invoiceNumber = `INV-${String(count + 1).padStart(5, '0')}`;

  return prisma.invoice.create({
    data: { ...data, invoiceNumber },
    include: { customer: true, quotation: true },
  });
};

exports.recordPayment = async (data) => {
  const invoice = await prisma.invoice.findUnique({ where: { id: data.invoiceId } });
  if (!invoice) throw new AppError('Invoice not found', 404);

  const payment = await prisma.payment.create({
    data: {
      ...data,
      status: 'COMPLETED',
      paidAt: new Date(),
    },
  });

  const totalPaid = await prisma.payment.aggregate({
    where: { invoiceId: data.invoiceId, status: 'COMPLETED' },
    _sum: { amount: true },
  });

  if (Number(totalPaid._sum.amount) >= Number(invoice.total)) {
    await prisma.invoice.update({
      where: { id: data.invoiceId },
      data: { status: 'PAID', paidAt: new Date() },
    });
  }

  return payment;
};
