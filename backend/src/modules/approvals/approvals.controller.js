'use strict';

const approvalsService = require('./approvals.service');
const { sendSuccess } = require('../../utils/response');

exports.list = async (req, res, next) => {
  try {
    const result = await approvalsService.list(req.query);
    sendSuccess(res, 200, 'Approval requests fetched', { approvalRequests: result });
  } catch (err) {
    next(err);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const result = await approvalsService.getById(req.params.id);
    sendSuccess(res, 200, 'Approval request fetched', { approvalRequest: result });
  } catch (err) {
    next(err);
  }
};

exports.approve = async (req, res, next) => {
  try {
    const result = await approvalsService.approve(req.params.id, req.user.id, req.body.comments);
    sendSuccess(res, 200, 'Request approved', { approvalRequest: result });
  } catch (err) {
    next(err);
  }
};

exports.reject = async (req, res, next) => {
  try {
    const result = await approvalsService.reject(req.params.id, req.user.id, req.body.comments);
    sendSuccess(res, 200, 'Request rejected', { approvalRequest: result });
  } catch (err) {
    next(err);
  }
};

exports.returnForRevision = async (req, res, next) => {
  try {
    const result = await approvalsService.returnForRevision(req.params.id, req.user.id, req.body.comments);
    sendSuccess(res, 200, 'Request returned for revision', { approvalRequest: result });
  } catch (err) {
    next(err);
  }
};
