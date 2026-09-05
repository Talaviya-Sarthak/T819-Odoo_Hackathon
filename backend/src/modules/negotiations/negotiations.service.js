'use strict';

const { PrismaClient } = require('@prisma/client');
const { AppError } = require('../../utils/errors');

const prisma = new PrismaClient();

exports.getMessages = async (quotationId) => {
  const negotiation = await prisma.negotiation.findFirst({
    where: { quotationId },
    include: {
      messages: {
        include: { senderUser: true, quotationLine: true },
        orderBy: { createdAt: 'asc' },
      },
    },
  });
  if (!negotiation) throw new AppError('No negotiation found for this quotation', 404);
  return negotiation;
};

exports.sendMessage = async (quotationId, userId, { message, quotationLineId }) => {
  let negotiation = await prisma.negotiation.findFirst({ where: { quotationId } });

  if (!negotiation) {
    const quotation = await prisma.quotation.findUnique({ where: { id: quotationId } });
    if (!quotation) throw new AppError('Quotation not found', 404);

    negotiation = await prisma.negotiation.create({
      data: {
        quotationId,
        customerId: quotation.customerId,
      },
    });
  }

  const msg = await prisma.negotiationMessage.create({
    data: {
      negotiationId: negotiation.id,
      senderUserId: userId,
      message,
      quotationLineId: quotationLineId || null,
    },
    include: { senderUser: true, quotationLine: true },
  });

  if (quotation.status === 'DRAFT' || quotation.status === 'APPROVED') {
    await prisma.quotation.update({
      where: { id: quotationId },
      data: { status: 'NEGOTIATION' },
    });
  }

  return msg;
};

exports.requestChange = async (quotationId, userId, { quotationLineId, requestedDiscountPercent, message }) => {
  let negotiation = await prisma.negotiation.findFirst({ where: { quotationId } });

  if (!negotiation) {
    const quotation = await prisma.quotation.findUnique({ where: { id: quotationId } });
    if (!quotation) throw new AppError('Quotation not found', 404);

    negotiation = await prisma.negotiation.create({
      data: {
        quotationId,
        customerId: quotation.customerId,
      },
    });
  }

  const msg = await prisma.negotiationMessage.create({
    data: {
      negotiationId: negotiation.id,
      senderUserId: userId,
      quotationLineId,
      requestedDiscountPercent,
      message: message || `Requested discount of ${requestedDiscountPercent}%`,
    },
    include: { senderUser: true, quotationLine: true },
  });

  return msg;
};
