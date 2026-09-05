'use strict';

const { PrismaClient } = require('@prisma/client');
const { AppError } = require('../../utils/errors');

const prisma = new PrismaClient();

exports.salesReport = async ({ period }) => {
  const now = new Date();
  let startDate;

  if (period === 'month') {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  } else if (period === 'quarter') {
    const quarter = Math.floor(now.getMonth() / 3);
    startDate = new Date(now.getFullYear(), quarter * 3, 1);
  } else if (period === 'year') {
    startDate = new Date(now.getFullYear(), 0, 1);
  } else {
    startDate = new Date(0);
  }

  const quotations = await prisma.quotation.findMany({
    where: {
      createdAt: { gte: startDate },
      status: { notIn: ['DRAFT', 'CANCELLED'] },
    },
    include: { customer: true, salesRep: true },
  });

  const totalSales = quotations.reduce((sum, q) => sum + Number(q.totalAmount), 0);
  const totalCost = quotations.reduce((sum, q) => sum + Number(q.totalCost), 0);
  const totalMargin = totalSales - totalCost;

  const byStatus = {};
  for (const q of quotations) {
    byStatus[q.status] = (byStatus[q.status] || 0) + 1;
  }

  const bySalesRep = {};
  for (const q of quotations) {
    const repId = q.salesRepId;
    if (!bySalesRep[repId]) {
      bySalesRep[repId] = { name: q.salesRep?.name, count: 0, totalAmount: 0 };
    }
    bySalesRep[repId].count++;
    bySalesRep[repId].totalAmount += Number(q.totalAmount);
  }

  return {
    period: period || 'all',
    startDate,
    totalQuotations: quotations.length,
    totalSales,
    totalCost,
    totalMargin,
    marginPercent: totalSales > 0 ? (totalMargin / totalSales) * 100 : 0,
    byStatus,
    bySalesRep,
  };
};

exports.approvalReport = async () => {
  const [pending, approved, rejected, returned] = await Promise.all([
    prisma.approvalRequest.count({ where: { status: 'PENDING' } }),
    prisma.approvalRequest.count({ where: { status: 'APPROVED' } }),
    prisma.approvalRequest.count({ where: { status: 'REJECTED' } }),
    prisma.approvalRequest.count({ where: { status: 'RETURNED' } }),
  ]);

  const recentRequests = await prisma.approvalRequest.findMany({
    take: 10,
    include: { quotation: true, requestedBy: true },
    orderBy: { createdAt: 'desc' },
  });

  return {
    total: pending + approved + rejected + returned,
    pending,
    approved,
    rejected,
    returned,
    recentRequests,
  };
};

exports.fulfillmentReport = async () => {
  const orders = await prisma.fulfillmentOrder.groupBy({
    by: ['status'],
    _count: { id: true },
  });

  const statusCounts = {};
  for (const order of orders) {
    statusCounts[order.status] = order._count.id;
  }

  const recentOrders = await prisma.fulfillmentOrder.findMany({
    take: 10,
    include: { quotation: true, warehouse: true },
    orderBy: { createdAt: 'desc' },
  });

  return {
    total: orders.reduce((sum, o) => sum + o._count.id, 0),
    byStatus: statusCounts,
    recentOrders,
  };
};

exports.billingReport = async () => {
  const invoices = await prisma.invoice.findMany({
    include: { payments: true, customer: true },
  });

  const totalRevenue = invoices
    .filter((i) => i.status === 'PAID')
    .reduce((sum, i) => sum + Number(i.total), 0);

  const outstanding = invoices
    .filter((i) => i.status !== 'PAID' && i.status !== 'CANCELLED')
    .reduce((sum, i) => sum + Number(i.total), 0);

  const byStatus = {};
  for (const i of invoices) {
    byStatus[i.status] = (byStatus[i.status] || 0) + 1;
  }

  return {
    totalInvoices: invoices.length,
    totalRevenue,
    outstanding,
    byStatus,
  };
};
