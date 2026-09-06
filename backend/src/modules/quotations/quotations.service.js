'use strict';

const { AppError } = require('../../utils/errors');
const { calculateQuotation } = require('../../services/calculation.service');
const { getEffectiveProductPrice } = require('../../services/pricing.service');
const { checkQuotationDiscounts } = require('../../services/discount-governance.service');
const { validateTransition, assertEditable } = require('../../services/quotation-state.service');
const { logAudit } = require('../../services/audit.service');
const { generateKey, cache } = require('../../cache');
const prisma = require('../../database/prisma');

const QUOTATIONS_LIST_TTL = 30; // 30 seconds

exports.list = async ({ user, status, customerId, salesRepId, limit = 50, offset = 0 } = {}) => {
  const where = {};

  // 1. Role-based isolation
  if (user && user.role === 'CUSTOMER') {
    let custId = user.customerId || user.customer_id;
    if (!custId && user.id) {
      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { customerId: true },
      });
      custId = dbUser?.customerId;
    }

    if (!custId) {
      const customerRecord = await prisma.customer.findFirst({
        where: {
          OR: [
            { email: user.email },
            { ownerId: user.id },
          ],
        },
      });
      if (customerRecord) {
        custId = customerRecord.id;
      }
    }

    if (custId) {
      where.customerId = custId;
    } else {
      return [];
    }
  } else if (user && user.role === 'SALES_REP') {
    where.salesRepId = salesRepId || user.id;
  } else {
    if (salesRepId) where.salesRepId = salesRepId;
  }

  if (customerId && (!user || user.role !== 'CUSTOMER')) {
    where.customerId = customerId;
  }
  if (status === 'CUSTOMER_CONFIRMED') {
    where.status = status;
    where.salesOrder = null;
  } else if (status) {
    where.status = status;
  }

  const cacheKey = generateKey(
    'quotation:list',
    user?.id,
    user?.role,
    status,
    customerId,
    salesRepId,
    limit,
    offset
  );

  // Check cache first
  const cached = cache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const result = await prisma.quotation.findMany({
    where,
    include: {
      customer: { include: { tier: true } },
      salesRep: { select: { id: true, name: true, email: true, role: true } },
      lines: {
        include: {
          product: { include: { category: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: Number(limit) || 50,
    skip: Number(offset) || 0,
  });

  // Store in cache with 30-second TTL for quotation lists
  cache.set(cacheKey, result, QUOTATIONS_LIST_TTL);

  return result;
};

exports.getById = async (id, user = null) => {
  const quotation = await prisma.quotation.findUnique({
    where: { id },
    include: {
      customer: { include: { tier: true } },
      salesRep: { select: { id: true, name: true, email: true, role: true } },
      lines: {
        include: {
          product: { include: { category: true } },
        },
      },
      approvalRequests: {
        include: {
          approver: { select: { id: true, name: true, email: true, role: true } },
          history: {
            include: {
              user: { select: { id: true, name: true, email: true, role: true } },
            },
            orderBy: { createdAt: 'asc' },
          },
        },
      },
    },
  });

  if (!quotation) throw new AppError('Quotation not found', 404);

  // Security: Customer cannot access other customer's quotation
  if (user && user.role === 'CUSTOMER') {
    let custId = user.customerId || user.customer_id;
    if (!custId && user.id) {
      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { customerId: true },
      });
      custId = dbUser?.customerId;
    }

    const isOwnCustomer = (custId && custId === quotation.customerId) || 
      (quotation.customer?.email && quotation.customer.email.toLowerCase() === user.email.toLowerCase()) ||
      quotation.customer?.ownerId === user.id;

    if (!isOwnCustomer) {
      throw new AppError('Access denied. You can only access your own quotations.', 403);
    }
  }

  return quotation;
};

exports.create = async (data, user = null) => {
  let customerId = data.customerId;
  const salesRepId = data.salesRepId || (user && user.role === 'SALES_REP' ? user.id : null);

  if (user && user.role === 'CUSTOMER') {
    const custId = user.customerId || user.customer_id;
    if (custId) {
      customerId = custId;
    } else {
      const cust = await prisma.customer.findFirst({
        where: { OR: [{ email: user.email }, { ownerId: user.id }] },
      });
      if (!cust) throw new AppError('No associated customer account found for user', 400);
      customerId = cust.id;
    }
  }

  if (!customerId) throw new AppError('Customer ID is required', 400);

  // Validate customer
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    include: { tier: true },
  });
  if (!customer) throw new AppError('Customer not found', 404);

  // Resolve rep id if not set
  const finalSalesRepId = salesRepId || customer.salesRepId || customer.ownerId || (user ? user.id : null);
  if (!finalSalesRepId) throw new AppError('Sales representative ID is required', 400);

  // Generate unique quotation number
  const count = await prisma.quotation.count();
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const quotationNumber = `QUO-${dateStr}-${String(count + 1).padStart(4, '0')}`;

  // Process and calculate quotation lines
  const rawLines = data.lines || [];
  const linesToCalculate = [];

  for (const item of rawLines) {
    if (!item.productId) throw new AppError('Each line must have a productId', 400);

    let unitPrice = item.unitPrice;
    let unitCost = item.unitCost;
    let taxRate = item.taxRate;

    // Fetch defaults if not provided
    if (unitPrice === undefined || unitCost === undefined || taxRate === undefined) {
      const pricing = await getEffectiveProductPrice(item.productId, customerId);
      if (unitPrice === undefined) unitPrice = pricing.price;
      if (unitCost === undefined) unitCost = pricing.costPrice;
      if (taxRate === undefined) taxRate = pricing.taxRate;
    }

    linesToCalculate.push({
      productId: item.productId,
      quantity: item.quantity || 1,
      unitPrice,
      unitCost,
      discountPercent: item.discountPercent || 0,
      taxRate: taxRate || 0,
      billingType: item.billingType || 'ONE_TIME',
    });
  }

  // Calculate using centralized Decimal calculation engine
  const { processedLines, totals } = calculateQuotation(linesToCalculate);

  const quotation = await prisma.quotation.create({
    data: {
      quotationNumber,
      customerId,
      salesRepId: finalSalesRepId,
      status: 'DRAFT',
      currency: data.currency || customer.currency || 'USD',
      subtotal: totals.subtotal,
      discountAmount: totals.discountAmount,
      taxAmount: totals.taxAmount,
      totalAmount: totals.totalAmount,
      totalCost: totals.totalCost,
      grossMargin: totals.grossMargin,
      marginPercentage: totals.marginPercentage,
      validUntil: data.validUntil ? new Date(data.validUntil) : null,
      notes: data.notes || null,
      lines: {
        create: processedLines.map((l) => ({
          productId: l.productId,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
          unitCost: l.unitCost,
          discountPercent: l.discountPercent,
          discountAmount: l.discountAmount,
          taxRate: l.taxRate,
          lineSubtotal: l.lineSubtotal,
          lineTotal: l.lineTotal,
          marginAmount: l.marginAmount,
          billingType: l.billingType,
        })),
      },
    },
    include: {
      customer: { include: { tier: true } },
      salesRep: { select: { id: true, name: true, email: true } },
      lines: { include: { product: true } },
    },
  });

  // Invalidate quotation list cache
  try {
    cache.delete('quotation:list');
  } catch (e) {
    // Cache deletion failure should not break the operation
  }

  await logAudit({
    userId: user?.id,
    action: 'QUOTATION_CREATE',
    entityType: 'QUOTATION',
    entityId: quotation.id,
    newValues: {
      quotationNumber,
      customerId,
      totalAmount: totals.totalAmount.toString(),
      status: 'DRAFT',
    },
  });

  return quotation;
};

exports.update = async (id, data, user = null) => {
  const existing = await prisma.quotation.findUnique({
    where: { id },
    include: { lines: true, customer: true },
  });
  if (!existing) throw new AppError('Quotation not found', 404);

  // Validate editable status
  assertEditable(existing.status);

  // Security: Customer cannot update others' quotations
  if (user && user.role === 'CUSTOMER') {
    const isOwnCustomer = (user.customerId || user.customer_id) === existing.customerId || 
      existing.customer?.email?.toLowerCase() === user.email.toLowerCase();
    if (!isOwnCustomer) throw new AppError('Access denied', 403);
  }

  // Reject arbitrary status updates via PUT
  if (data.status && data.status !== existing.status) {
    throw new AppError(
      'Arbitrary status change not allowed via PUT. Use dedicated workflow endpoints (/submit, /approve, /reject, /confirm).',
      400
    );
  }

  const updatePayload = {};
  if (data.notes !== undefined) updatePayload.notes = data.notes;
  if (data.validUntil !== undefined) updatePayload.validUntil = data.validUntil ? new Date(data.validUntil) : null;
  if (data.currency !== undefined) updatePayload.currency = data.currency;

  // If lines are updated, recalculate all totals with Decimal engine
  if (data.lines && Array.isArray(data.lines)) {
    const linesToCalculate = [];
    for (const item of data.lines) {
      let unitPrice = item.unitPrice;
      let unitCost = item.unitCost;
      let taxRate = item.taxRate;

      if (unitPrice === undefined || unitCost === undefined || taxRate === undefined) {
        const pricing = await getEffectiveProductPrice(item.productId, existing.customerId);
        if (unitPrice === undefined) unitPrice = pricing.price;
        if (unitCost === undefined) unitCost = pricing.costPrice;
        if (taxRate === undefined) taxRate = pricing.taxRate;
      }

      linesToCalculate.push({
        productId: item.productId,
        quantity: item.quantity || 1,
        unitPrice,
        unitCost,
        discountPercent: item.discountPercent || 0,
        taxRate: taxRate || 0,
        billingType: item.billingType || 'ONE_TIME',
      });
    }

    const { processedLines, totals } = calculateQuotation(linesToCalculate);

    // Replace lines in transaction
    const [_, updatedQuotation] = await prisma.$transaction([
      prisma.quotationLine.deleteMany({ where: { quotationId: id } }),
      prisma.quotation.update({
        where: { id },
        data: {
          ...updatePayload,
          subtotal: totals.subtotal,
          discountAmount: totals.discountAmount,
          taxAmount: totals.taxAmount,
          totalAmount: totals.totalAmount,
          totalCost: totals.totalCost,
          grossMargin: totals.grossMargin,
          marginPercentage: totals.marginPercentage,
          lines: {
            create: processedLines.map((l) => ({
              productId: l.productId,
              quantity: l.quantity,
              unitPrice: l.unitPrice,
              unitCost: l.unitCost,
              discountPercent: l.discountPercent,
              discountAmount: l.discountAmount,
              taxRate: l.taxRate,
              lineSubtotal: l.lineSubtotal,
              lineTotal: l.lineTotal,
              marginAmount: l.marginAmount,
              billingType: l.billingType,
            })),
          },
        },
        include: {
          customer: { include: { tier: true } },
          salesRep: { select: { id: true, name: true, email: true } },
          lines: { include: { product: true } },
        },
      }),
    ]);

    // Invalidate quotation list cache
    try {
      cache.delete('quotation:list');
    } catch (e) {
      // Cache deletion failure should not break the operation
    }

    await logAudit({
      userId: user?.id,
      action: 'QUOTATION_UPDATE',
      entityType: 'QUOTATION',
      entityId: id,
      oldValues: { totalAmount: existing.totalAmount.toString() },
      newValues: { totalAmount: totals.totalAmount.toString() },
    });

    return updatedQuotation;
  }

  // Update without lines modification
  const updatedQuotation = await prisma.quotation.update({
    where: { id },
    data: updatePayload,
    include: {
      customer: { include: { tier: true } },
      salesRep: { select: { id: true, name: true, email: true } },
      lines: { include: { product: true } },
    },
  });

  // Invalidate quotation list cache
  try {
    cache.delete('quotation:list');
  } catch (e) {
    // Cache deletion failure should not break the operation
  }

  await logAudit({
    userId: user?.id,
    action: 'QUOTATION_UPDATE',
    entityType: 'QUOTATION',
    entityId: id,
    newValues: updatePayload,
  });

  return updatedQuotation;
};

exports.submit = async (id, user = null) => {
  const quotation = await prisma.quotation.findUnique({
    where: { id },
    include: { customer: { include: { tier: true } }, lines: true },
  });
  if (!quotation) throw new AppError('Quotation not found', 404);

  // Validate state transition
  if (quotation.status !== 'DRAFT' && quotation.status !== 'NEGOTIATION' && quotation.status !== 'RETURNED') {
    throw new AppError(`Cannot submit quotation from '${quotation.status}' status. Must be DRAFT, NEGOTIATION, or RETURNED.`, 400);
  }

  if (!quotation.lines || quotation.lines.length === 0) {
    throw new AppError('Cannot submit quotation with no line items', 400);
  }

  // Run governance & risk check
  const governance = await checkQuotationDiscounts(id);

  let nextStatus = 'PENDING_APPROVAL';
  if (!governance.approvalRequired) {
    nextStatus = 'APPROVED';
  }

  validateTransition(quotation.status, nextStatus);

  const updatedQuotation = await prisma.quotation.update({
    where: { id },
    data: { status: nextStatus },
    include: {
      customer: true,
      salesRep: true,
      lines: { include: { product: true } },
      approvalRequests: true,
    },
  });

  // Invalidate quotation list cache
  try {
    cache.clear();
  } catch (e) {
    // Cache deletion failure should not break the operation
  }

  if (governance.approvalRequired) {
    const totalSteps = governance.requiredRoles.length || 1;
    const initialRole = governance.requiredRoles[0] || 'SALES_MANAGER';

    await prisma.approvalRequest.create({
      data: {
        quotationId: id,
        status: 'PENDING',
        riskScore: governance.riskScore || 0,
        riskLevel: governance.riskLevel || governance.risk || 'LOW',
        currentStep: 1,
        totalSteps,
        requiredRole: initialRole,
        reason: governance.reason || 'Governance approval required for quotation discounts/margins',
        history: {
          create: {
            action: 'SUBMITTED',
            step: 1,
            notes: `Submitted by ${user ? user.name || user.email : 'system'}: ${governance.reason || 'Approval required'}`,
            userId: user?.id || quotation.salesRepId,
          },
        },
      },
    });
  }

  await logAudit({
    userId: user?.id,
    action: 'QUOTATION_SUBMIT',
    entityType: 'QUOTATION',
    entityId: id,
    oldValues: { status: quotation.status },
    newValues: {
      status: nextStatus,
      approvalRequired: governance.approvalRequired,
      riskLevel: governance.riskLevel || governance.risk,
    },
  });

  return {
    quotation: updatedQuotation,
    governance,
  };
};

exports.confirm = async (id, user = null) => {
  const quotation = await prisma.quotation.findUnique({
    where: { id },
    include: { customer: true, salesRep: true, lines: true },
  });
  if (!quotation) throw new AppError('Quotation not found', 404);

  // Validate state transition: APPROVED -> CUSTOMER_CONFIRMED
  validateTransition(quotation.status, 'CUSTOMER_CONFIRMED');

  // Customer authorization check
  if (user && user.role === 'CUSTOMER') {
    let custId = user.customerId || user.customer_id;
    if (!custId && user.id) {
      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { customerId: true },
      });
      custId = dbUser?.customerId;
    }

    const isOwnCustomer = (custId && custId === quotation.customerId) || 
      (quotation.customer?.email && quotation.customer.email.toLowerCase() === user.email.toLowerCase()) ||
      quotation.customer?.ownerId === user.id;
    if (!isOwnCustomer) throw new AppError('Access denied', 403);
  }

  // Invalidate quotation list cache
  try {
    cache.clear();
  } catch (e) {
    // Cache deletion failure should not break the operation
  }

  const updated = await prisma.quotation.update({
    where: { id },
    data: { status: 'CUSTOMER_CONFIRMED' },
    include: {
      customer: true,
      salesRep: true,
      lines: { include: { product: true } },
    },
  });

  await logAudit({
    userId: user?.id,
    action: 'CUSTOMER_CONFIRMED',
    entityType: 'QUOTATION',
    entityId: id,
    oldValues: { status: quotation.status },
    newValues: { status: 'CUSTOMER_CONFIRMED' },
  });

  return updated;
};
