'use strict';

const logger = require('../utils/logger');
const prisma = require('../database/prisma');

/**
 * Creates an audit log entry in the database.
 * 
 * @param {Object} params
 * @param {string} [params.userId]
 * @param {string} params.action
 * @param {string} params.entityType
 * @param {string} [params.entityId]
 * @param {Object} [params.oldValues]
 * @param {Object} [params.newValues]
 * @param {string} [params.ipAddress]
 */
async function logAudit({
  userId = null,
  action,
  entityType,
  entityId = null,
  oldValues = null,
  newValues = null,
  ipAddress = null,
}) {
  try {
    const entry = await prisma.auditLog.create({
      data: {
        userId,
        action,
        entityType,
        entityId,
        oldValues: oldValues ? JSON.parse(JSON.stringify(oldValues)) : null,
        newValues: newValues ? JSON.parse(JSON.stringify(newValues)) : null,
        ipAddress,
      },
    });
    return entry;
  } catch (err) {
    logger.error({ err, action, entityType, entityId }, 'Failed to record audit log');
    // Non-blocking: audit failure should not break critical path transactions
    return null;
  }
}

const { parsePagination, paginateResult } = require('../utils/pagination');

/**
 * Lists audit logs with optional filtering.
 */
async function listAuditLogs(query = {}) {
  const { entityType, entityId, userId } = query;
  const { page, limit, skip, take } = parsePagination(query, { defaultLimit: 50, maxLimit: 100 });
  const where = {};
  if (entityType) where.entityType = entityType;
  if (entityId) where.entityId = entityId;
  if (userId) where.userId = userId;

  const [total, items] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take,
      skip,
    }),
  ]);

  return paginateResult(items, total, page, limit);
}

module.exports = {
  logAudit,
  listAuditLogs,
};
