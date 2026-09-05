'use strict';

const prisma = require('../../database/prisma');
const { AppError } = require('../../utils/errors');
const { checkQuotationDiscounts } = require('../../services/discount-governance.service');

exports.getMessages = async (quotationId) => {
  let negotiations = await prisma.negotiation.findMany({
    where: { quotationId },
    include: {
      messages: {
        orderBy: { createdAt: 'asc' },
      },
      changeRequests: {
        orderBy: { createdAt: 'desc' },
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  let negotiation = negotiations[0];

  if (!negotiation) {
    const quotation = await prisma.quotation.findUnique({ where: { id: quotationId } });
    if (!quotation) throw new AppError('Quotation not found', 404);

    negotiation = await prisma.negotiation.create({
      data: {
        quotationId,
        customerId: quotation.customerId,
        status: 'OPEN',
      },
      include: {
        messages: true,
        changeRequests: true,
      },
    });
  } else if (negotiations.length > 1) {
    // Consolidate duplicate negotiations into canonical one
    const duplicateIds = negotiations.slice(1).map((n) => n.id);
    await prisma.negotiationMessage.updateMany({
      where: { negotiationId: { in: duplicateIds } },
      data: { negotiationId: negotiation.id },
    });
    await prisma.changeRequest.updateMany({
      where: { negotiationId: { in: duplicateIds } },
      data: { negotiationId: negotiation.id },
    });
    await prisma.negotiation.deleteMany({
      where: { id: { in: duplicateIds } },
    });

    // Re-fetch all consolidated messages and change requests
    negotiation.messages = await prisma.negotiationMessage.findMany({
      where: { negotiationId: negotiation.id },
      orderBy: { createdAt: 'asc' },
    });
    negotiation.changeRequests = await prisma.changeRequest.findMany({
      where: { negotiationId: negotiation.id },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Enrich messages with sender info
  const userIds = [...new Set(negotiation.messages.map((m) => m.senderId))];
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true, email: true, role: true },
  });
  const userMap = new Map(users.map((u) => [u.id, u]));

  const enrichedMessages = negotiation.messages.map((m) => ({
    ...m,
    sender: userMap.get(m.senderId) || { name: 'User', role: 'USER' },
  }));

  return {
    ...negotiation,
    messages: enrichedMessages,
  };
};

exports.sendMessage = async (quotationId, userId, { message, quotationLineId }) => {
  const quotation = await prisma.quotation.findUnique({ where: { id: quotationId } });
  if (!quotation) throw new AppError('Quotation not found', 404);

  let negotiation = await prisma.negotiation.findFirst({
    where: { quotationId },
    orderBy: { createdAt: 'asc' },
  });

  if (!negotiation) {
    negotiation = await prisma.negotiation.create({
      data: {
        quotationId,
        customerId: quotation.customerId,
        status: 'OPEN',
      },
    });
  }

  const msg = await prisma.negotiationMessage.create({
    data: {
      negotiationId: negotiation.id,
      senderId: userId,
      message,
    },
  });

  // If quotation was APPROVED or DRAFT, transition to NEGOTIATION
  if (quotation.status === 'APPROVED' || quotation.status === 'DRAFT') {
    await prisma.quotation.update({
      where: { id: quotationId },
      data: { status: 'NEGOTIATION' },
    });
  }

  const sender = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, role: true },
  });

  return { ...msg, sender };
};

exports.requestChange = async (quotationId, userId, { quotationLineId, requestedDiscountPercent, changeType, notes, message }) => {
  const quotation = await prisma.quotation.findUnique({
    where: { id: quotationId },
    include: { lines: true },
  });
  if (!quotation) throw new AppError('Quotation not found', 404);

  let negotiation = await prisma.negotiation.findFirst({
    where: { quotationId },
    orderBy: { createdAt: 'asc' },
  });

  if (!negotiation) {
    negotiation = await prisma.negotiation.create({
      data: {
        quotationId,
        customerId: quotation.customerId,
        status: 'OPEN',
      },
    });
  }

  const changeMsg = message || (requestedDiscountPercent !== undefined 
    ? `Counter-offer requested: ${requestedDiscountPercent}% discount`
    : `Change requested: ${notes || 'Quotation terms review'}`);

  // 1. Create message in chat thread
  const msg = await prisma.negotiationMessage.create({
    data: {
      negotiationId: negotiation.id,
      senderId: userId,
      message: `[CHANGE REQUEST] ${changeMsg}`,
    },
  });

  // 2. Record ChangeRequest in DB
  const cr = await prisma.changeRequest.create({
    data: {
      negotiationId: negotiation.id,
      requestedBy: userId,
      changeType: changeType || (requestedDiscountPercent !== undefined ? 'COUNTER_DISCOUNT' : 'TERM_REVISION'),
      newValue: {
        requestedDiscountPercent: requestedDiscountPercent !== undefined ? Number(requestedDiscountPercent) : null,
        quotationLineId: quotationLineId || null,
        notes: notes || null,
      },
      status: 'PENDING_APPROVAL',
    },
  });

  // 3. Counter-discount workflow:
  // If higher discount requested, transition quotation to PENDING_APPROVAL so manager reviews
  let requiresApproval = true;
  await prisma.quotation.update({
    where: { id: quotationId },
    data: { status: 'PENDING_APPROVAL' },
  });

  // Create approval request for manager
  await prisma.approvalRequest.create({
    data: {
      quotationId,
      status: 'PENDING',
      riskScore: 50,
      riskLevel: 'MEDIUM',
      currentStep: 1,
      totalSteps: 1,
      requiredRole: 'SALES_MANAGER',
      reason: `Customer counter-discount request: ${changeMsg}`,
      history: {
        create: {
          action: 'SUBMITTED',
          step: 1,
          notes: `Customer requested counter-discount: ${changeMsg}`,
          userId,
        },
      },
    },
  });

  const sender = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, role: true },
  });

  return {
    message: { ...msg, sender },
    changeRequest: cr,
    status: 'PENDING_APPROVAL',
    notice: 'Request submitted for approval.',
  };
};

