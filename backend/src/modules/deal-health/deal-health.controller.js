'use strict';

const dealHealthService = require('./deal-health.service');
const { sendSuccess } = require('../../utils/response');

exports.getDealHealthSummary = async (req, res, next) => {
  try {
    const result = await dealHealthService.getDealHealthSummary();
    sendSuccess(res, 200, 'Deal health summary fetched', { summary: result });
  } catch (err) {
    next(err);
  }
};

exports.getAlerts = async (req, res, next) => {
  try {
    const result = await dealHealthService.getAlerts(req.user.id);
    sendSuccess(res, 200, 'Alerts fetched', { alerts: result });
  } catch (err) {
    next(err);
  }
};
