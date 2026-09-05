'use strict';

const { Server } = require('socket.io');
const jwtService = require('../modules/auth/jwt/jwt.service');
const prisma = require('../database/prisma');
const logger = require('../utils/logger');
const negotiationsService = require('../modules/negotiations/negotiations.service');

let io = null;

/**
 * Check if the user is authorized to access a quotation's negotiation room
 */
async function authorizeQuotationAccess(quotationId, user) {
  if (!quotationId || !user) return { authorized: false, reason: 'Invalid parameters' };

  const quotation = await prisma.quotation.findUnique({
    where: { id: quotationId },
    select: { id: true, customerId: true, status: true, quotationNumber: true },
  });

  if (!quotation) {
    return { authorized: false, reason: 'Quotation not found' };
  }

  // Internal staff (sales, managers, admin) can access negotiations
  const internalRoles = ['SALES_REP', 'SALES_MANAGER', 'ADMIN', 'MANAGER_ADMIN', 'FINANCE'];
  if (internalRoles.includes(user.role)) {
    return { authorized: true, quotation };
  }

  // Customer users must match quotation's customerId
  if (user.role === 'CUSTOMER') {
    let customerId = user.customerId || user.customer_id;
    if (!customerId) {
      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { customerId: true },
      });
      customerId = dbUser?.customerId;
    }

    if (!customerId || quotation.customerId !== customerId) {
      return { authorized: false, reason: 'Unauthorized access to quotation' };
    }

    return { authorized: true, quotation };
  }

  return { authorized: false, reason: 'Forbidden role' };
}

/**
 * Initialize Socket.IO server
 */
function initWebSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        // Allow all local / client origins in development and production
        callback(null, true);
      },
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 30000,
    pingInterval: 25000,
  });

  // Authentication Middleware for WebSocket Connections
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        (socket.handshake.headers?.authorization &&
          socket.handshake.headers.authorization.replace(/^Bearer\s+/i, ''));

      if (!token) {
        return next(new Error('Authentication required: Token missing'));
      }

      const decoded = jwtService.verifyAccessToken(token);
      if (!decoded) {
        return next(new Error('Authentication failed: Invalid token'));
      }

      // Enrich customer ID if needed
      if (decoded.role === 'CUSTOMER' && !decoded.customerId && !decoded.customer_id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: decoded.id },
          select: { customerId: true, name: true, email: true },
        });
        if (dbUser?.customerId) {
          decoded.customerId = dbUser.customerId;
          decoded.customer_id = dbUser.customerId;
        }
        if (dbUser?.name && !decoded.name) {
          decoded.name = dbUser.name;
        }
      }

      socket.user = decoded;
      next();
    } catch (err) {
      logger.warn({ err: err.message }, 'WebSocket authentication failed');
      next(new Error(`Authentication failed: ${err.message}`));
    }
  });

  io.on('connection', (socket) => {
    const user = socket.user;
    logger.info({ userId: user.id, email: user.email, role: user.role }, 'WebSocket client connected');

    /**
     * Join a quotation negotiation room
     */
    socket.on('join_negotiation', async (payload, callback) => {
      try {
        const quotationId = typeof payload === 'string' ? payload : payload?.quotationId;
        if (!quotationId) {
          if (callback) callback({ error: 'Quotation ID required' });
          return;
        }

        const authResult = await authorizeQuotationAccess(quotationId, user);
        if (!authResult.authorized) {
          logger.warn({ userId: user.id, quotationId, reason: authResult.reason }, 'User denied access to negotiation room');
          if (callback) callback({ error: authResult.reason || 'Forbidden' });
          socket.emit('error', { message: authResult.reason || 'Access denied' });
          return;
        }

        const room = `negotiation:${quotationId}`;
        socket.join(room);
        logger.info({ userId: user.id, room }, 'User joined negotiation room');

        if (callback) callback({ success: true, room, quotation: authResult.quotation });

        // Notify other room participants
        socket.to(room).emit('user_joined', {
          userId: user.id,
          name: user.name || user.email,
          role: user.role,
        });
      } catch (err) {
        logger.error({ err }, 'Error joining negotiation room');
        if (callback) callback({ error: err.message });
      }
    });

    /**
     * Leave a quotation negotiation room
     */
    socket.on('leave_negotiation', (payload) => {
      const quotationId = typeof payload === 'string' ? payload : payload?.quotationId;
      if (quotationId) {
        const room = `negotiation:${quotationId}`;
        socket.leave(room);
        socket.to(room).emit('user_left', {
          userId: user.id,
          name: user.name || user.email,
        });
      }
    });

    /**
     * Send a new message in the negotiation
     */
    socket.on('send_message', async (payload, callback) => {
      try {
        const { quotationId, message, quotationLineId, clientMessageId } = payload || {};

        if (!quotationId || !message || !message.trim()) {
          if (callback) callback({ error: 'Quotation ID and message text are required' });
          return;
        }

        const authResult = await authorizeQuotationAccess(quotationId, user);
        if (!authResult.authorized) {
          if (callback) callback({ error: authResult.reason || 'Forbidden' });
          return;
        }

        // Persist to PostgreSQL database
        const savedMessage = await negotiationsService.sendMessage(quotationId, user.id, {
          message: message.trim(),
          quotationLineId,
        });

        const room = `negotiation:${quotationId}`;

        // Broadcast to all participants in the room
        io.to(room).emit('new_message', {
          ...savedMessage,
          quotationId,
          clientMessageId,
        });

        // Acknowledge back to sender
        if (callback) {
          callback({
            success: true,
            message: savedMessage,
            clientMessageId,
          });
        }
      } catch (err) {
        logger.error({ err }, 'Error handling send_message via WebSocket');
        if (callback) callback({ error: err.message || 'Failed to send message' });
      }
    });

    /**
     * Submit a counter-discount request
     */
    socket.on('request_counter_discount', async (payload, callback) => {
      try {
        const { quotationId, requestedDiscountPercent, notes, message, quotationLineId } = payload || {};

        if (!quotationId) {
          if (callback) callback({ error: 'Quotation ID is required' });
          return;
        }

        const authResult = await authorizeQuotationAccess(quotationId, user);
        if (!authResult.authorized) {
          if (callback) callback({ error: authResult.reason || 'Forbidden' });
          return;
        }

        // Persist to PostgreSQL database and trigger approval workflow
        const result = await negotiationsService.requestChange(quotationId, user.id, {
          requestedDiscountPercent,
          notes,
          message,
          quotationLineId,
        });

        const room = `negotiation:${quotationId}`;

        // Broadcast the generated message and status update to room
        io.to(room).emit('new_message', {
          ...result.message,
          quotationId,
        });

        io.to(room).emit('quotation_status_changed', {
          quotationId,
          status: result.status,
          changeRequest: result.changeRequest,
          notice: result.notice,
        });

        if (callback) {
          callback({
            success: true,
            result,
          });
        }
      } catch (err) {
        logger.error({ err }, 'Error handling request_counter_discount via WebSocket');
        if (callback) callback({ error: err.message || 'Failed to submit counter-discount' });
      }
    });

    /**
     * Typing indicators (ephemeral)
     */
    socket.on('typing', (payload) => {
      const { quotationId, isTyping } = payload || {};
      if (quotationId) {
        const room = `negotiation:${quotationId}`;
        socket.to(room).emit('user_typing', {
          quotationId,
          userId: user.id,
          name: user.name || user.email,
          role: user.role,
          isTyping: Boolean(isTyping),
        });
      }
    });

    socket.on('disconnect', (reason) => {
      logger.info({ userId: user.id, reason }, 'WebSocket client disconnected');
    });
  });

  return io;
}

/**
 * Get the active Socket.IO server instance
 */
function getIO() {
  return io;
}

/**
 * Broadcast helper for REST controllers
 */
function broadcastNegotiationMessage(quotationId, message) {
  if (io && quotationId) {
    io.to(`negotiation:${quotationId}`).emit('new_message', {
      ...message,
      quotationId,
    });
  }
}

function broadcastQuotationStatusChange(quotationId, statusData) {
  if (io && quotationId) {
    io.to(`negotiation:${quotationId}`).emit('quotation_status_changed', {
      quotationId,
      ...statusData,
    });
  }
}

module.exports = {
  initWebSocket,
  getIO,
  authorizeQuotationAccess,
  broadcastNegotiationMessage,
  broadcastQuotationStatusChange,
};
