'use strict';

const approvalsService = require('./approvals.service');
const { sendSuccess } = require('../../utils/response');

exports.list = async (req, res, next) => {
  try {
    const result = await approvalsService.list({ ...req.query, user: req.user });
    sendSuccess(res, 200, 'Approval requests fetched', { approvals: result, approvalRequests: result });
  } catch (err) {
    next(err);
  }
};

exports.getPending = async (req, res, next) => {
  try {
    const result = await approvalsService.list({ user: req.user, status: 'PENDING' });
    sendSuccess(res, 200, 'Pending approvals fetched', { approvals: result, approvalRequests: result });
  } catch (err) {
    next(err);
  }
};

exports.getHistory = async (req, res, next) => {
  try {
    const result = await approvalsService.getById(req.params.id, req.user);
    sendSuccess(res, 200, 'Approval history fetched', { history: result.history || [] });
  } catch (err) {
    next(err);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const result = await approvalsService.getById(req.params.id, req.user);
    sendSuccess(res, 200, 'Approval request fetched', { approvalRequest: result });
  } catch (err) {
    next(err);
  }
};

exports.approve = async (req, res, next) => {
  try {
    const result = await approvalsService.approve(req.params.id, req.user, req.body.comments);
    sendSuccess(res, 200, result.message, result);
  } catch (err) {
    next(err);
  }
};

exports.reject = async (req, res, next) => {
  try {
    const result = await approvalsService.reject(req.params.id, req.user, req.body.comments);
    sendSuccess(res, 200, result.message, result);
  } catch (err) {
    next(err);
  }
};

exports.returnForRevision = async (req, res, next) => {
  try {
    const result = await approvalsService.returnForRevision(req.params.id, req.user, req.body.comments);
    sendSuccess(res, 200, result.message, result);
  } catch (err) {
    next(err);
  }
};
