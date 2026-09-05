'use strict';

const { PrismaClient } = require('@prisma/client');
const { AppError } = require('../../utils/errors');

const prisma = new PrismaClient();

exports.getDealHealthSummary = async () => {
  const quotations = await prisma.quotation.findMany({
    include: { dealHealth: true, customer: true, salesRep: true },
    orderBy: { updatedAt: 'desc' },
  });

  const summary = {
    total: quotations.length,
    healthy: 0,
    atRisk: 0,
    critical: 0,
    noHealthData: 0,
    quotations: [],
  };

  for (const q of quotations) {
    if (!q.dealHealth) {
      summary.noHealthData++;
      continue;
    }

    const health = q.dealHealth;
    if (health.healthStatus === 'HEALTHY') summary.healthy++;
    else if (health.healthStatus === 'AT_RISK') summary.atRisk++;
    else if (health.healthStatus === 'CRITICAL') summary.critical++;

    summary.quotations.push({
      id: q.id,
      quotationNumber: q.quotationNumber,
      totalAmount: q.totalAmount,
      status: q.status,
      customer: q.customer?.name,
      salesRep: q.salesRep?.name,
      health: {
        score: health.healthScore,
        status: health.healthStatus,
        daysStalled: health.daysStalled,
        discountAnomaly: health.discountAnomaly,
        deliveryRisk: health.deliveryRisk,
        approvalDelay: health.approvalDelay,
      },
    });
  }

  return summary;
};

exports.getAlerts = async (userId) => {
  return prisma.alert.findMany({
    where: {
      userId,
      isRead: false,
    },
    include: { quotation: true },
    orderBy: [
      { severity: 'desc' },
      { createdAt: 'desc' },
    ],
  });
};
