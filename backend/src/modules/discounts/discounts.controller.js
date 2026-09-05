'use strict';

const discountsService = require('./discounts.service');
const { sendSuccess } = require('../../utils/response');

exports.checkDiscount = async (req, res, next) => {
  try {
    const result = await discountsService.checkDiscount(req.params.id);
    sendSuccess(res, 200, 'Discount check completed', result);
  } catch (err) {
    next(err);
  }
};
