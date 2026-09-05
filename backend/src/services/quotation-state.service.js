'use strict';

const { AppError } = require('../utils/errors');

const VALID_TRANSITIONS = {
  DRAFT: ['PENDING_APPROVAL', 'APPROVED', 'CANCELLED'],
  PENDING_APPROVAL: ['APPROVED', 'REJECTED', 'DRAFT', 'RETURNED', 'CANCELLED'],
  APPROVED: ['NEGOTIATION', 'CUSTOMER_CONFIRMED', 'CANCELLED'],
  NEGOTIATION: ['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'CUSTOMER_CONFIRMED', 'CANCELLED'],
  CUSTOMER_CONFIRMED: ['ORDER_CONFIRMED', 'CANCELLED'],
  ORDER_CONFIRMED: ['FULFILLMENT', 'CANCELLED'],
  FULFILLMENT: ['PARTIALLY_FULFILLED', 'FULFILLED', 'CANCELLED'],
  PARTIALLY_FULFILLED: ['FULFILLED', 'CANCELLED'],
  REJECTED: ['DRAFT', 'CANCELLED'],
  RETURNED: ['DRAFT', 'CANCELLED'],
  CANCELLED: [],
  FULFILLED: [],
};

/**
 * Validates if transition from currentStatus to nextStatus is permissible.
 * 
 * @param {string} currentStatus 
 * @param {string} nextStatus 
 * @throws {AppError}
 */
function validateTransition(currentStatus, nextStatus) {
  if (currentStatus === nextStatus) return;

  const allowed = VALID_TRANSITIONS[currentStatus] || [];
  if (!allowed.includes(nextStatus)) {
    throw new AppError(
      `Invalid quotation status transition from '${currentStatus}' to '${nextStatus}'. Permitted transitions: ${allowed.join(', ') || 'None'}`,
      400
    );
  }
}

/**
 * Asserts that a quotation is in an editable state (DRAFT or NEGOTIATION).
 * 
 * @param {string} status 
 * @throws {AppError}
 */
function assertEditable(status) {
  if (status !== 'DRAFT' && status !== 'NEGOTIATION') {
    throw new AppError(
      `Quotation in '${status}' status cannot be modified. Only DRAFT or NEGOTIATION quotations can be edited.`,
      400
    );
  }
}

module.exports = {
  VALID_TRANSITIONS,
  validateTransition,
  assertEditable,
};
