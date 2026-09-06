'use strict';

const { AppError } = require('../../utils/errors');
const { logAudit } = require('../../services/audit.service');
const prisma = require('../../database/prisma');

const { parsePagination, paginateResult } = require('../../utils/pagination');

const ROLE_STEP_MAP = {
  1: 'SALES_MANAGER',
  2: 'FINANCE',
  3: 'ADMIN',
};

exports.list = async (query = {}) => {
  const { user, status, quotationId, search } = query;
  // Customers cannot view internal approval queue
  if (user && user.role === 'CUSTOMER') {
    throw new AppError('Access denied. Customers cannot access approval queues.', 403);
  }

  const { page, limit, skip, take } = parsePagination(query, { defaultLimit: 10, maxLimit: 100 });
  const where = {};
  if (status) where.status = status;
  if (quotationId) where.quotationId = quotationId;

  // If user is SALES_REP (and not manager/admin/finance), only show requests for their own quotations
  if (user && user.role === 'SALES_REP') {
    where.quotation = { salesRepId: user.id };
  } else if (user && user.role === 'FINANCE') {
    // Finance sees pending requests where requiredRole is FINANCE or all
    if (!status) {
      where.OR = [
        { requiredRole: 'FINANCE' },
        { status: 'APPROVED' },
      ];
    }
  }

  if (search) {
    const trimmed = String(search).trim();
    if (trimmed) {
      const searchFilter = [
        { quotation: { quotationNumber: { contains: trimmed, mode: 'insensitive' } } },
        { quotation: { customer: { name: { contains: trimmed, mode: 'insensitive' } } } },
        { reason: { contains: trimmed, mode: 'insensitive' } },
      ];
      if (where.OR) {
        where.AND = [{ OR: where.OR }, { OR: searchFilter }];
        delete where.OR;
      } else {
        where.OR = searchFilter;
      }
    }
  }

  const [total, items] = await Promise.all([
    prisma.approvalRequest.count({ where }),
    prisma.approvalRequest.findMany({
      where,
      include: {
        quotation: {
          include: {
            customer: { select: { id: true, name: true, company: true, tier: true } },
            salesRep: { select: { id: true, name: true, email: true } },
            lines: {
              include: {
                product: { select: { id: true, name: true, sku: true, category: true } },
              },
            },
          },
        },
        approver: { select: { id: true, name: true, email: true, role: true } },
        history: {
          include: {
            user: { select: { id: true, name: true, email: true, role: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
      take,
      skip,
    }),
  ]);

  return paginateResult(items, total, page, limit);
};

exports.getById = async (id, user = null) => {
  if (user && user.role === 'CUSTOMER') {
    throw new AppError('Access denied. Customers cannot access internal approval records.', 403);
  }

  const request = await prisma.approvalRequest.findUnique({
    where: { id },
    include: {
      quotation: {
        include: {
          customer: { select: { id: true, name: true, company: true, tier: true } },
          salesRep: { select: { id: true, name: true, email: true } },
          lines: {
            include: {
              product: { select: { id: true, name: true, sku: true, category: true } },
            },
          },
        },
      },
      approver: { select: { id: true, name: true, email: true, role: true } },
      history: {
        include: {
          user: { select: { id: true, name: true, email: true, role: true } },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  if (!request) throw new AppError('Approval request not found', 404);

  // If sales rep, only allowed if quotation belongs to them
  if (user && user.role === 'SALES_REP' && request.quotation.salesRepId !== user.id) {
    throw new AppError('Access denied', 403);
  }

  return request;
};

exports.approve = async (id, user, comments = '') => {
  if (!user) throw new AppError('Authentication required', 401);
  if (user.role === 'CUSTOMER') throw new AppError('Customers cannot approve quotations', 403);

  const request = await prisma.approvalRequest.findUnique({
    where: { id },
    include: { quotation: true },
  });
  if (!request) throw new AppError('Approval request not found', 404);
  if (request.status !== 'PENDING') throw new AppError(`Approval request is already ${request.status}`, 400);

  // Security Rule: SALES_REP cannot approve their own quotation unless explicitly ADMIN or MANAGER
  if (request.quotation.salesRepId === user.id && !['ADMIN', 'SALES_MANAGER', 'MANAGER_ADMIN'].includes(user.role)) {
    throw new AppError('Sales representatives cannot approve their own quotation', 403);
  }

  // Security Rule: Approver role verification
  const isAuthorizedRole = 
    user.role === request.requiredRole || 
    user.role === 'ADMIN' || 
    user.role === 'MANAGER_ADMIN' ||
    (user.role === 'SALES_MANAGER' && (request.requiredRole === 'SALES_MANAGER' || request.requiredRole === 'SALES_REP')) ||
    (user.role === 'FINANCE' && request.requiredRole === 'FINANCE');

  if (!isAuthorizedRole) {
    throw new AppError(`Step ${request.currentStep} requires approval by ${request.requiredRole} (your role: ${user.role})`, 403);
  }

  const isFinalStep = request.currentStep >= request.totalSteps;

  if (!isFinalStep) {
    // Multi-step chain: advance to next step (e.g. Sales Manager -> Finance)
    const nextStep = request.currentStep + 1;
    const nextRole = ROLE_STEP_MAP[nextStep] || 'FINANCE';

    const updated = await prisma.approvalRequest.update({
      where: { id },
      data: {
        currentStep: nextStep,
        requiredRole: nextRole,
        approverId: user.id,
        history: {
          create: {
            action: `APPROVED_STEP_${request.currentStep}`,
            step: request.currentStep,
            notes: comments || `Step ${request.currentStep} approved by ${user.role}. Forwarded to ${nextRole}.`,
            userId: user.id,
          },
        },
      },
      include: {
        quotation: true,
        history: true,
      },
    });

    await logAudit({
      userId: user.id,
      action: 'APPROVAL_STEP_APPROVED',
      entityType: 'APPROVAL_REQUEST',
      entityId: id,
      newValues: {
        approvedStep: request.currentStep,
        nextStep,
        nextRole,
        comments,
      },
    });

    return {
      status: 'STEP_APPROVED',
      message: `Step ${request.currentStep} approved. Forwarded to ${nextRole} for final approval.`,
      approvalRequest: updated,
    };
  }

  // Final step completed: mark request APPROVED and quotation APPROVED
  const updatedRequest = await prisma.approvalRequest.update({
    where: { id },
    data: {
      status: 'APPROVED',
      approverId: user.id,
      history: {
        create: {
          action: 'APPROVED',
          step: request.currentStep,
          notes: comments || 'Final approval granted',
          userId: user.id,
        },
      },
    },
    include: { history: true },
  });

  const updatedQuotation = await prisma.quotation.update({
    where: { id: request.quotationId },
    data: { status: 'APPROVED' },
  });

  await logAudit({
    userId: user.id,
    action: 'APPROVAL_COMPLETED',
    entityType: 'QUOTATION',
    entityId: request.quotationId,
    newValues: {
      status: 'APPROVED',
      approvalRequestId: id,
      comments,
    },
  });

  return {
    status: 'APPROVED',
    message: 'Quotation has been fully approved.',
    approvalRequest: updatedRequest,
    quotation: updatedQuotation,
  };
};

exports.reject = async (id, user, comments = '') => {
  if (!user) throw new AppError('Authentication required', 401);
  if (user.role === 'CUSTOMER') throw new AppError('Customers cannot review approval requests', 403);

  const request = await prisma.approvalRequest.findUnique({
    where: { id },
    include: { quotation: true },
  });
  if (!request) throw new AppError('Approval request not found', 404);
  if (request.status !== 'PENDING') throw new AppError(`Approval request is already ${request.status}`, 400);

  // Security Rule: SALES_REP cannot reject/approve their own quotation unless MANAGER/ADMIN
  if (request.quotation.salesRepId === user.id && !['ADMIN', 'SALES_MANAGER', 'MANAGER_ADMIN'].includes(user.role)) {
    throw new AppError('Sales representatives cannot review their own quotation', 403);
  }

  const isAuthorizedRole = 
    user.role === request.requiredRole || 
    user.role === 'ADMIN' || 
    user.role === 'MANAGER_ADMIN' ||
    user.role === 'SALES_MANAGER' ||
    user.role === 'FINANCE';
  if (!isAuthorizedRole) {
    throw new AppError('You do not have permission to reject this quotation', 403);
  }

  const updatedRequest = await prisma.approvalRequest.update({
    where: { id },
    data: {
      status: 'REJECTED',
      approverId: user.id,
      history: {
        create: {
          action: 'REJECTED',
          step: request.currentStep,
          notes: comments || 'Quotation rejected',
          userId: user.id,
        },
      },
    },
    include: { history: true },
  });

  const updatedQuotation = await prisma.quotation.update({
    where: { id: request.quotationId },
    data: { status: 'REJECTED' },
  });

  await logAudit({
    userId: user.id,
    action: 'APPROVAL_REJECTED',
    entityType: 'QUOTATION',
    entityId: request.quotationId,
    newValues: {
      status: 'REJECTED',
      comments,
    },
  });

  return {
    status: 'REJECTED',
    message: 'Quotation has been rejected.',
    approvalRequest: updatedRequest,
    quotation: updatedQuotation,
  };
};

exports.returnForRevision = async (id, user, comments = '') => {
  if (!user) throw new AppError('Authentication required', 401);
  if (user.role === 'CUSTOMER') throw new AppError('Customers cannot review approval requests', 403);

  const request = await prisma.approvalRequest.findUnique({
    where: { id },
    include: { quotation: true },
  });
  if (!request) throw new AppError('Approval request not found', 404);
  if (request.status !== 'PENDING') throw new AppError(`Approval request is already ${request.status}`, 400);

  if (request.quotation.salesRepId === user.id && !['ADMIN', 'SALES_MANAGER', 'MANAGER_ADMIN'].includes(user.role)) {
    throw new AppError('Sales representatives cannot review their own quotation', 403);
  }

  const isAuthorizedRole = 
    user.role === request.requiredRole || 
    user.role === 'ADMIN' || 
    user.role === 'MANAGER_ADMIN' ||
    user.role === 'SALES_MANAGER' ||
    user.role === 'FINANCE';
  if (!isAuthorizedRole) {
    throw new AppError('You do not have permission to return this quotation', 403);
  }

  const updatedRequest = await prisma.approvalRequest.update({
    where: { id },
    data: {
      status: 'RETURNED',
      approverId: user.id,
      history: {
        create: {
          action: 'RETURNED',
          step: request.currentStep,
          notes: comments || 'Returned for revision',
          userId: user.id,
        },
      },
    },
    include: { history: true },
  });

  const updatedQuotation = await prisma.quotation.update({
    where: { id: request.quotationId },
    data: { status: 'DRAFT' },
  });

  await logAudit({
    userId: user.id,
    action: 'APPROVAL_RETURNED',
    entityType: 'QUOTATION',
    entityId: request.quotationId,
    newValues: {
      status: 'DRAFT',
      comments,
    },
  });

  return {
    status: 'RETURNED',
    message: 'Quotation has been returned to draft for revision.',
    approvalRequest: updatedRequest,
    quotation: updatedQuotation,
  };
};
