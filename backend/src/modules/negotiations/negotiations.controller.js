'use strict';

const negotiationsService = require('./negotiations.service');
const { sendSuccess } = require('../../utils/response');
const { broadcastNegotiationMessage, broadcastQuotationStatusChange } = require('../../websocket/socket');

exports.getMessages = async (req, res, next) => {
  try {
    const result = await negotiationsService.getMessages(req.params.id);
    sendSuccess(res, 200, 'Negotiation messages fetched', result);
  } catch (err) {
    next(err);
  }
};

exports.sendMessage = async (req, res, next) => {
  try {
    const result = await negotiationsService.sendMessage(req.params.id, req.user.id, req.body);
    broadcastNegotiationMessage(req.params.id, result);
    sendSuccess(res, 201, 'Message sent', { negotiationMessage: result, ...result });
  } catch (err) {
    next(err);
  }
};

exports.requestChange = async (req, res, next) => {
  try {
    const result = await negotiationsService.requestChange(req.params.id, req.user.id, req.body);
    if (result.message) {
      broadcastNegotiationMessage(req.params.id, result.message);
    }
    broadcastQuotationStatusChange(req.params.id, {
      status: result.status,
      changeRequest: result.changeRequest,
      notice: result.notice,
    });
    sendSuccess(res, 201, 'Change requested', result);
  } catch (err) {
    next(err);
  }
};

