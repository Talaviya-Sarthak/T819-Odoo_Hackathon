'use strict';

const prisma = require('../../database/prisma');
const { AppError } = require('../../utils/errors');
const { logAudit } = require('../../services/audit.service');

exports.list = async () => {
  return prisma.warehouse.findMany({
    where: { active: true },
    include: {
      stocks: {
        include: {
          product: { select: { id: true, name: true, sku: true, basePrice: true, costPrice: true } },
        },
      },
    },
    orderBy: { name: 'asc' },
  });
};

exports.getById = async (id) => {
  const warehouse = await prisma.warehouse.findUnique({
    where: { id },
    include: {
      stocks: {
        include: {
          product: true,
        },
        orderBy: { product: { name: 'asc' } },
      },
      fulfillmentOrders: {
        take: 10,
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!warehouse) {
    throw new AppError('Warehouse not found', 404);
  }

  return warehouse;
};

exports.create = async (data, user = null) => {
  if (!data.name) throw new AppError('Warehouse name is required', 400);

  const warehouse = await prisma.warehouse.create({
    data: {
      name: data.name,
      code: data.code || `WH-${data.name.slice(0, 3).toUpperCase()}-${Date.now().toString().slice(-3)}`,
      location: data.location || null,
      active: data.active !== undefined ? data.active : true,
    },
  });

  await logAudit({
    userId: user?.id,
    action: 'WAREHOUSE_CREATED',
    entityType: 'WAREHOUSE',
    entityId: warehouse.id,
    newValues: warehouse,
  });

  return warehouse;
};

exports.update = async (id, data, user = null) => {
  const existing = await prisma.warehouse.findUnique({ where: { id } });
  if (!existing) throw new AppError('Warehouse not found', 404);

  const updated = await prisma.warehouse.update({
    where: { id },
    data: {
      name: data.name !== undefined ? data.name : existing.name,
      code: data.code !== undefined ? data.code : existing.code,
      location: data.location !== undefined ? data.location : existing.location,
      active: data.active !== undefined ? data.active : existing.active,
    },
  });

  await logAudit({
    userId: user?.id,
    action: 'WAREHOUSE_UPDATED',
    entityType: 'WAREHOUSE',
    entityId: id,
    oldValues: existing,
    newValues: updated,
  });

  return updated;
};

exports.delete = async (id, user = null) => {
  const existing = await prisma.warehouse.findUnique({
    where: { id },
    include: { stocks: true, fulfillmentOrders: true },
  });
  if (!existing) throw new AppError('Warehouse not found', 404);

  // Soft delete by deactivating
  const deactivated = await prisma.warehouse.update({
    where: { id },
    data: { active: false },
  });

  await logAudit({
    userId: user?.id,
    action: 'WAREHOUSE_DEACTIVATED',
    entityType: 'WAREHOUSE',
    entityId: id,
  });

  return deactivated;
};
