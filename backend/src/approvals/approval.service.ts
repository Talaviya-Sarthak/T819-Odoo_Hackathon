import prisma from '../common/prisma';
import { UserRole, ApprovalRequestStatus, QuotationStatus } from '@prisma/client';
import { NotFoundError, BadRequestError, ForbiddenError } from '../common/errors';
import { checkDiscounts } from '../discounts/discount.service';

export async function getApprovalRules() {
  return prisma.approvalRule.findMany({
    where: { active: true },
    orderBy: { stepOrder: 'asc' },
  });
}

export async function submitForApproval(quotationId: string, userId: string) {
  const quotation = await prisma.quotation.findUnique({
    where: { id: quotationId },
    include: { customer: true },
  });

  if (!quotation) throw new NotFoundError('Quotation not found');
  if (quotation.status !== QuotationStatus.DRAFT && quotation.status !== QuotationStatus.RETURNED) {
    throw new BadRequestError('Quotation must be in DRAFT or RETURNED status to submit');
  }

  // Run discount check
  const discountResult = await checkDiscounts(quotationId);

  if (discountResult.allowed) {
    // No approval needed, auto-approve
    await prisma.quotation.update({
      where: { id: quotationId },
      data: { status: QuotationStatus.APPROVED },
    });
    return { autoApproved: true, quotation };
  }

  // Determine approval steps based on risk
  const approvalSteps = buildApprovalChain(discountResult.riskScore);

  // Create approval request
  const approvalRequest = await prisma.approvalRequest.create({
    data: {
      quotationId,
      riskScore: discountResult.riskScore,
      riskLevel: discountResult.riskLevel as any,
      currentStep: 1,
      totalSteps: approvalSteps.length,
      requiredRole: approvalSteps[0].role,
      reason: `Discount violations detected. Risk score: ${discountResult.riskScore}. Violations: ${discountResult.violations.length} lines.`,
    },
  });

  // Update quotation status
  await prisma.quotation.update({
    where: { id: quotationId },
    data: { status: QuotationStatus.PENDING_APPROVAL },
  });

  return {
    autoApproved: false,
    approvalRequest,
    discountResult,
    approvalSteps,
  };
}

function buildApprovalChain(riskScore: number): Array<{ role: UserRole; stepOrder: number }> {
  const steps: Array<{ role: UserRole; stepOrder: number }> = [];

  // Always start with SALES_MANAGER
  steps.push({ role: UserRole.SALES_MANAGER, stepOrder: 1 });

  if (riskScore >= 60) {
    steps.push({ role: UserRole.FINANCE, stepOrder: 2 });
  }

  if (riskScore >= 80) {
    steps.push({ role: UserRole.ADMIN, stepOrder: 3 });
  }

  return steps;
}

export async function approveRequest(approvalRequestId: string, userId: string, userRole: string, notes?: string) {
  const request = await prisma.approvalRequest.findUnique({
    where: { id: approvalRequestId },
    include: { quotation: true },
  });

  if (!request) throw new NotFoundError('Approval request not found');
  if (request.status !== ApprovalRequestStatus.PENDING) {
    throw new BadRequestError('Approval request is not pending');
  }
  if (request.requiredRole !== userRole) {
    throw new ForbiddenError(`Only ${request.requiredRole} can approve this request at step ${request.currentStep}`);
  }

  // Record history
  await prisma.approvalHistory.create({
    data: {
      approvalRequestId,
      action: 'APPROVED',
      step: request.currentStep,
      notes,
      userId,
    },
  });

  // Check if there are more steps
  if (request.currentStep < request.totalSteps) {
    // Move to next step
    const nextStep = request.currentStep + 1;
    const nextRule = await prisma.approvalRule.findFirst({
      where: { stepOrder: nextStep, active: true },
      orderBy: { stepOrder: 'asc' },
    });

    await prisma.approvalRequest.update({
      where: { id: approvalRequestId },
      data: {
        currentStep: nextStep,
        requiredRole: nextRule?.requiredRole || request.requiredRole,
      },
    });

    return { approved: false, message: `Approved at step ${request.currentStep}. Moved to step ${nextStep}.` };
  }

  // All steps approved
  await prisma.approvalRequest.update({
    where: { id: approvalRequestId },
    data: { status: ApprovalRequestStatus.APPROVED },
  });

  await prisma.quotation.update({
    where: { id: request.quotationId },
    data: { status: QuotationStatus.APPROVED },
  });

  return { approved: true, message: 'All approval steps completed. Quotation approved.' };
}

export async function rejectRequest(approvalRequestId: string, userId: string, userRole: string, notes?: string) {
  const request = await prisma.approvalRequest.findUnique({
    where: { id: approvalRequestId },
    include: { quotation: true },
  });

  if (!request) throw new NotFoundError('Approval request not found');
  if (request.status !== ApprovalRequestStatus.PENDING) {
    throw new BadRequestError('Approval request is not pending');
  }

  await prisma.approvalHistory.create({
    data: {
      approvalRequestId,
      action: 'REJECTED',
      step: request.currentStep,
      notes,
      userId,
    },
  });

  await prisma.approvalRequest.update({
    where: { id: approvalRequestId },
    data: { status: ApprovalRequestStatus.REJECTED },
  });

  await prisma.quotation.update({
    where: { id: request.quotationId },
    data: { status: QuotationStatus.REJECTED },
  });

  return { rejected: true, message: 'Approval request rejected. Quotation rejected.' };
}

export async function returnRequest(approvalRequestId: string, userId: string, userRole: string, notes?: string) {
  const request = await prisma.approvalRequest.findUnique({
    where: { id: approvalRequestId },
    include: { quotation: true },
  });

  if (!request) throw new NotFoundError('Approval request not found');
  if (request.status !== ApprovalRequestStatus.PENDING) {
    throw new BadRequestError('Approval request is not pending');
  }

  await prisma.approvalHistory.create({
    data: {
      approvalRequestId,
      action: 'RETURNED',
      step: request.currentStep,
      notes,
      userId,
    },
  });

  await prisma.approvalRequest.update({
    where: { id: approvalRequestId },
    data: { status: ApprovalRequestStatus.RETURNED },
  });

  await prisma.quotation.update({
    where: { id: request.quotationId },
    data: { status: QuotationStatus.RETURNED },
  });

  return { returned: true, message: 'Approval request returned. Quotation returned for revision.' };
}

export async function getPendingApprovals(userRole: string) {
  return prisma.approvalRequest.findMany({
    where: {
      status: ApprovalRequestStatus.PENDING,
      requiredRole: userRole as UserRole,
    },
    include: {
      quotation: {
        include: {
          customer: true,
          salesRepresentative: { select: { id: true, name: true, email: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}
