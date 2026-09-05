'use strict';

const negotiationsService = require('./negotiations.service');
const { sendSuccess } = require('../../utils/response');

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
    sendSuccess(res, 201, 'Message sent', { message: result });
  } catch (err) {
    next(err);
  }
};

exports.requestChange = async (req, res, next) => {
  try {
    const result = await negotiationsService.requestChange(req.params.id, req.user.id, req.body);
    sendSuccess(res, 201, 'Change requested', { message: result });
  } catch (err) {
    next(err);
  }
};
