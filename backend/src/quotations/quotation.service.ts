import prisma from '../common/prisma';
import { Decimal } from '@prisma/client/runtime/library';
import { NotFoundError, BadRequestError } from '../common/errors';
import { calculateLineTotals, calculateQuotationTotals } from './calculation.service';
import { validateTransition } from './state-machine';
import { createAuditLog } from '../audit/audit.service';
import { QuotationStatus } from '@prisma/client';

let quotationCounter = 1000;

async function getNextQuotationNumber(): Promise<string> {
  const last = await prisma.quotation.findFirst({
    orderBy: { createdAt: 'desc' },
    select: { quotationNumber: true },
  });
  if (last) {
    const num = parseInt(last.quotationNumber.replace('Q-', ''), 10);
    quotationCounter = num + 1;
  } else {
    quotationCounter = 1001;
  }
  return `Q-${quotationCounter}`;
}

export async function getAllQuotations(filters?: {
  status?: string;
  salesRepId?: string;
  customerId?: string;
}) {
  const where: any = {};
  if (filters?.status) where.status = filters.status;
  if (filters?.salesRepId) where.salesRepId = filters.salesRepId;
  if (filters?.customerId) where.customerId = filters.customerId;

  return prisma.quotation.findMany({
    where,
    include: {
      customer: { include: { tier: true } },
      salesRepresentative: { select: { id: true, name: true, email: true } },
      lines: { include: { product: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getQuotationById(id: string) {
  const quotation = await prisma.quotation.findUnique({
    where: { id },
    include: {
      customer: { include: { tier: true } },
      salesRepresentative: { select: { id: true, name: true, email: true } },
      lines: { include: { product: { include: { category: true } } } },
      approvalRequests: true,
    },
  });
  if (!quotation) throw new NotFoundError('Quotation not found');
  return quotation;
}

export async function createQuotation(data: {
  customerId: string;
  salesRepId: string;
  currency?: string;
  notes?: string;
  validUntil?: string;
}) {
  const quotationNumber = await getNextQuotationNumber();

  return prisma.quotation.create({
    data: {
      quotationNumber,
      customerId: data.customerId,
      salesRepId: data.salesRepId,
      currency: data.currency || 'USD',
      notes: data.notes || null,
      validUntil: data.validUntil ? new Date(data.validUntil) : null,
      status: QuotationStatus.DRAFT,
    },
    include: {
      customer: true,
      salesRepresentative: { select: { id: true, name: true, email: true } },
    },
  });
}

export async function updateQuotation(id: string, data: {
  status?: QuotationStatus;
  notes?: string;
  validUntil?: string;
}, userId?: string) {
  const existing = await prisma.quotation.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError('Quotation not found');

  // Validate status transition
  if (data.status && data.status !== existing.status) {
    validateTransition(existing.status, data.status);
  }

  const updated = await prisma.quotation.update({
    where: { id },
    data: {
      ...(data.status && { status: data.status }),
      ...(data.notes !== undefined && { notes: data.notes }),
      ...(data.validUntil && { validUntil: new Date(data.validUntil) }),
    },
    include: {
      customer: true,
      salesRepresentative: { select: { id: true, name: true, email: true } },
      lines: { include: { product: true } },
    },
  });

  if (userId) {
    await createAuditLog({
      userId,
      action: 'quotation_updated',
      entityType: 'quotation',
      entityId: id,
      oldValues: { status: existing.status },
      newValues: { status: updated.status },
    });
  }

  return updated;
}

export async function addQuotationLine(quotationId: string, data: {
  productId: string;
  quantity: number;
  unitPrice: number;
  unitCost: number;
  discountPercent?: number;
  taxRate?: number;
  billingType?: string;
}) {
  const quotation = await prisma.quotation.findUnique({ where: { id: quotationId } });
  if (!quotation) throw new NotFoundError('Quotation not found');
  if (quotation.status !== QuotationStatus.DRAFT && quotation.status !== QuotationStatus.RETURNED) {
    throw new BadRequestError('Can only add lines to DRAFT or RETURNED quotations');
  }

  const calc = calculateLineTotals({
    quantity: data.quantity,
    unitPrice: new Decimal(data.unitPrice),
    unitCost: new Decimal(data.unitCost),
    discountPercent: new Decimal(data.discountPercent || 0),
    taxRate: new Decimal(data.taxRate || 0),
  });

  const line = await prisma.quotationLine.create({
    data: {
      quotationId,
      productId: data.productId,
      quantity: data.quantity,
      unitPrice: new Decimal(data.unitPrice),
      unitCost: new Decimal(data.unitCost),
      discountPercent: new Decimal(data.discountPercent || 0),
      discountAmount: calc.discountAmount,
      taxRate: new Decimal(data.taxRate || 0),
      lineSubtotal: calc.lineSubtotal,
      lineTotal: calc.lineTotal,
      marginAmount: calc.marginAmount,
      billingType: (data.billingType as any) || 'ONE_TIME',
    },
    include: { product: true },
  });

  // Recalculate quotation totals
  await recalculateQuotation(quotationId);

  return line;
}

export async function removeQuotationLine(lineId: string) {
  const line = await prisma.quotationLine.findUnique({ where: { id: lineId } });
  if (!line) throw new NotFoundError('Quotation line not found');

  await prisma.quotationLine.delete({ where: { id: lineId } });
  await recalculateQuotation(line.quotationId);
}

async function recalculateQuotation(quotationId: string) {
  const lines = await prisma.quotationLine.findMany({
    where: { quotationId },
  });

  const lineData = lines.map(l => ({
    quantity: l.quantity,
    unitPrice: l.unitPrice,
    unitCost: l.unitCost,
    discountPercent: l.discountPercent,
    taxRate: l.taxRate,
  }));

  const totals = calculateQuotationTotals(lineData);

  await prisma.quotation.update({
    where: { id: quotationId },
    data: {
      subtotal: totals.subtotal,
      discountAmount: totals.discountAmount,
      taxAmount: totals.taxAmount,
      totalAmount: totals.totalAmount,
      totalCost: totals.totalCost,
      grossMargin: totals.grossMargin,
      marginPercentage: totals.marginPercentage,
    },
  });
}
