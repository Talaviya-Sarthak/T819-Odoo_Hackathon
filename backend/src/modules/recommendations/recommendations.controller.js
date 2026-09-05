'use strict';

const recommendationsService = require('./recommendations.service');
const { sendSuccess } = require('../../utils/response');

exports.getRecommendations = async (req, res, next) => {
  try {
    const result = await recommendationsService.getRecommendations(req.params.id);
    sendSuccess(res, 200, 'Recommendations fetched', { recommendations: result });
  } catch (err) {
    next(err);
  }
};

exports.addToQuotation = async (req, res, next) => {
  try {
    const result = await recommendationsService.addToQuotation(req.params.id);
    sendSuccess(res, 200, 'Recommendation added to quotation', { recommendation: result });
  } catch (err) {
    next(err);
  }
};

exports.dismiss = async (req, res, next) => {
  try {
    const result = await recommendationsService.dismiss(req.params.id);
    sendSuccess(res, 200, 'Recommendation dismissed', { recommendation: result });
  } catch (err) {
    next(err);
  }
};
