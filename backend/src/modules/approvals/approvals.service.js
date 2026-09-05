'use strict';

const { PrismaClient } = require('@prisma/client');
const { AppError } = require('../../utils/errors');

const prisma = new PrismaClient();

exports.list = async ({ status }) => {
  const where = {};
  if (status) where.status = status;

  return prisma.approvalRequest.findMany({
    where,
    include: {
      quotation: { include: { customer: true } },
      requestedBy: true,
      assignedTo: true,
    },
    orderBy: { createdAt: 'desc' },
  });
};

exports.getById = async (id) => {
  const request = await prisma.approvalRequest.findUnique({
    where: { id },
    include: {
      quotation: { include: { customer: true, salesRep: true, lines: true } },
      requestedBy: true,
      assignedTo: true,
      history: { orderBy: { createdAt: 'desc' } },
    },
  });
  if (!request) throw new AppError('Approval request not found', 404);
  return request;
};

exports.approve = async (id, userId, comments) => {
  const request = await prisma.approvalRequest.findUnique({ where: { id } });
  if (!request) throw new AppError('Approval request not found', 404);
  if (request.status !== 'PENDING') throw new AppError('Request is not pending', 400);

  const [updated] = await prisma.$transaction([
    prisma.approvalRequest.update({
      where: { id },
      data: {
        status: 'APPROVED',
        resolvedAt: new Date(),
        assignedToId: userId,
      },
    }),
    prisma.approvalHistory.create({
      data: {
        approvalRequestId: id,
        action: 'APPROVED',
        comments,
      },
    }),
    prisma.quotation.update({
      where: { id: request.quotationId },
      data: { status: 'APPROVED' },
    }),
  ]);

  return updated;
};

exports.reject = async (id, userId, comments) => {
  const request = await prisma.approvalRequest.findUnique({ where: { id } });
  if (!request) throw new AppError('Approval request not found', 404);
  if (request.status !== 'PENDING') throw new AppError('Request is not pending', 400);

  const [updated] = await prisma.$transaction([
    prisma.approvalRequest.update({
      where: { id },
      data: {
        status: 'REJECTED',
        resolvedAt: new Date(),
        assignedToId: userId,
      },
    }),
    prisma.approvalHistory.create({
      data: {
        approvalRequestId: id,
        action: 'REJECTED',
        comments,
      },
    }),
    prisma.quotation.update({
      where: { id: request.quotationId },
      data: { status: 'REJECTED' },
    }),
  ]);

  return updated;
};

exports.returnForRevision = async (id, userId, comments) => {
  const request = await prisma.approvalRequest.findUnique({ where: { id } });
  if (!request) throw new AppError('Approval request not found', 404);
  if (request.status !== 'PENDING') throw new AppError('Request is not pending', 400);

  const [updated] = await prisma.$transaction([
    prisma.approvalRequest.update({
      where: { id },
      data: {
        status: 'RETURNED',
        resolvedAt: new Date(),
        assignedToId: userId,
      },
    }),
    prisma.approvalHistory.create({
      data: {
        approvalRequestId: id,
        action: 'RETURNED',
        comments,
      },
    }),
    prisma.quotation.update({
      where: { id: request.quotationId },
      data: { status: 'DRAFT' },
    }),
  ]);

  return updated;
};
