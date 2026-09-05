'use strict';

const { checkQuotationDiscounts } = require('../../services/discount-governance.service');
const { logAudit } = require('../../services/audit.service');

exports.checkDiscount = async (quotationId, userId = null) => {
  const result = await checkQuotationDiscounts(quotationId);

  await logAudit({
    userId,
    action: 'DISCOUNT_CHECK',
    entityType: 'QUOTATION',
    entityId: quotationId,
    newValues: {
      excess: result.excess,
      risk: result.risk,
      approvalRequired: result.approvalRequired,
    },
  });

  return result;
};
