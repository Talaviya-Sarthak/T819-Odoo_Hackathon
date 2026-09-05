'use strict';

const prisma = require('../../database/prisma');
const { AppError } = require('../../utils/errors');

exports.getDealHealthSummary = async () => {
  const [quotations, dealHealthRecords] = await Promise.all([
    prisma.quotation.findMany({
      include: { customer: true, salesRep: true },
      orderBy: { updatedAt: 'desc' },
    }),
    prisma.dealHealth.findMany(),
  ]);

  const healthMap = new Map(dealHealthRecords.map((dh) => [dh.quotationId, dh]));

  const summary = {
    total: quotations.length,
    healthy: 0,
    atRisk: 0,
    critical: 0,
    noHealthData: 0,
    quotations: [],
  };

  for (const q of quotations) {
    const existingHealth = healthMap.get(q.id);

    let score = existingHealth ? existingHealth.healthScore : 85;
    let status = 'HEALTHY';

    // Calculate dynamic health metrics based on real quotation data
    const margin = Number(q.marginPercentage || 0);
    const subtotal = Number(q.subtotal || q.totalAmount || 0);
    const discount = Number(q.discountAmount || 0);
    const discountPct = subtotal > 0 ? (discount / subtotal) * 100 : 0;
    const daysStalled = Math.max(0, Math.floor((Date.now() - new Date(q.createdAt).getTime()) / (1000 * 60 * 60 * 24)));

    if (discountPct > 15) score -= 35;
    else if (discountPct > 10) score -= 20;

    if (margin > 0 && margin < 10) score -= 40;
    else if (margin > 0 && margin < 20) score -= 20;

    if (daysStalled > 7) score -= 20;
    if (q.status === 'PENDING_APPROVAL') score -= 15;
    if (q.status === 'REJECTED') score -= 50;

    score = Math.max(10, Math.min(100, score));

    if (score >= 70) status = 'HEALTHY';
    else if (score >= 45) status = 'AT_RISK';
    else status = 'CRITICAL';

    if (status === 'HEALTHY') summary.healthy++;
    else if (status === 'AT_RISK') summary.atRisk++;
    else summary.critical++;

    summary.quotations.push({
      id: q.id,
      quotationNumber: q.quotationNumber,
      totalAmount: q.totalAmount,
      status: q.status,
      customer: q.customer?.name,
      salesRep: q.salesRep?.name,
      health: {
        score,
        status,
        daysStalled,
        discountAnomaly: discountPct > 15,
        deliveryRisk: false,
        approvalDelay: q.status === 'PENDING_APPROVAL' && daysStalled > 3,
      },
    });
  }

  return summary;
};

exports.getAlerts = async (userId) => {
  const alerts = await prisma.alert.findMany({
    where: { acknowledged: false },
    orderBy: { createdAt: 'desc' },
  });

  return alerts;
};
