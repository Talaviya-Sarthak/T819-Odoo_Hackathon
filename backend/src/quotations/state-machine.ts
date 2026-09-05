import { QuotationStatus } from '@prisma/client';
import { BadRequestError } from '../common/errors';

type TransitionMap = Record<QuotationStatus, QuotationStatus[]>;

const VALID_TRANSITIONS: TransitionMap = {
  DRAFT: [QuotationStatus.PENDING_APPROVAL, QuotationStatus.CANCELLED],
  PENDING_APPROVAL: [QuotationStatus.APPROVED, QuotationStatus.REJECTED, QuotationStatus.RETURNED, QuotationStatus.CANCELLED],
  APPROVED: [QuotationStatus.CONVERTED, QuotationStatus.CANCELLED],
  REJECTED: [QuotationStatus.DRAFT, QuotationStatus.CANCELLED],
  RETURNED: [QuotationStatus.DRAFT, QuotationStatus.PENDING_APPROVAL],
  CONVERTED: [],
  EXPIRED: [QuotationStatus.DRAFT],
  CANCELLED: [QuotationStatus.DRAFT],
};

export function canTransition(current: QuotationStatus, next: QuotationStatus): boolean {
  return VALID_TRANSITIONS[current]?.includes(next) ?? false;
}

export function validateTransition(current: QuotationStatus, next: QuotationStatus): void {
  if (!canTransition(current, next)) {
    throw new BadRequestError(
      `Cannot transition quotation from ${current} to ${next}. ` +
      `Valid transitions: ${VALID_TRANSITIONS[current]?.join(', ') || 'none'}`
    );
  }
}

export function getValidTransitions(current: QuotationStatus): QuotationStatus[] {
  return VALID_TRANSITIONS[current] || [];
}
