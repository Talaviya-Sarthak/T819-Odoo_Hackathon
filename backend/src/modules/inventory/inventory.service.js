'use strict';

const prisma = require('../../database/prisma');
const { AppError } = require('../../utils/errors');
const { logAudit } = require('../../services/audit.service');

exports.list = async ({ warehouseId, productId } = {}) => {
  const where = {};
  if (warehouseId) where.warehouseId = warehouseId;
  if (productId) where.productId = productId;

  const stocks = await prisma.warehouseStock.findMany({
    where,
    include: {
      warehouse: { select: { id: true, name: true, code: true, location: true, active: true } },
      product: { select: { id: true, name: true, sku: true, unit: true, basePrice: true, costPrice: true } },
    },
    orderBy: [
      { warehouse: { name: 'asc' } },
      { product: { name: 'asc' } },
    ],
  });

  return stocks.map((s) => ({
    id: s.id,
    warehouseId: s.warehouseId,
    warehouseName: s.warehouse?.name,
    warehouseCode: s.warehouse?.code,
    productId: s.productId,
    productName: s.product?.name,
    sku: s.product?.sku,
    quantityOnHand: s.quantity,
    quantityReserved: s.reservedQty,
    availableQuantity: Math.max(0, s.quantity - s.reservedQty),
    reorderLevel: s.reorderLevel,
    isLowStock: s.quantity <= s.reorderLevel,
    unitCost: Number(s.product?.costPrice || 0),
    inventoryValue: Number(s.product?.costPrice || 0) * s.quantity,
    updatedAt: s.updatedAt,
  }));
};

exports.getById = async (id) => {
  const stock = await prisma.warehouseStock.findUnique({
    where: { id },
    include: {
      warehouse: true,
      product: true,
    },
  });

  if (!stock) throw new AppError('Stock item not found', 404);

  return {
    ...stock,
    quantityOnHand: stock.quantity,
    quantityReserved: stock.reservedQty,
    availableQuantity: Math.max(0, stock.quantity - stock.reservedQty),
    inventoryValue: Number(stock.product?.costPrice || 0) * stock.quantity,
  };
};

exports.getByWarehouse = async (warehouseId) => {
  return exports.list({ warehouseId });
};

exports.adjust = async (idOrPayload, payloadOrOptions = {}, user = null) => {
  let id = typeof idOrPayload === 'string' ? idOrPayload : idOrPayload?.id;
  let quantityChange = typeof idOrPayload === 'object' ? (idOrPayload.adjustment ?? idOrPayload.quantityChange) : (payloadOrOptions.adjustment ?? payloadOrOptions.quantityChange);
  let reason = typeof idOrPayload === 'object' ? (idOrPayload.reason || '') : (payloadOrOptions.reason || '');
  let type = typeof idOrPayload === 'object' ? (idOrPayload.type || 'ADJUSTMENT') : (payloadOrOptions.type || 'ADJUSTMENT');

  if (!id && typeof idOrPayload === 'object' && idOrPayload.warehouseId && idOrPayload.productId) {
    const s = await prisma.warehouseStock.findUnique({
      where: { warehouseId_productId: { warehouseId: idOrPayload.warehouseId, productId: idOrPayload.productId } },
    });
    if (s) id = s.id;
  }

  if (quantityChange === undefined || isNaN(Number(quantityChange))) {
    throw new AppError('A valid quantityChange or adjustment is required', 400);
  }

  const change = parseInt(quantityChange, 10);

  const updated = await prisma.$transaction(async (tx) => {
    const stock = await tx.warehouseStock.findUnique({
      where: { id },
      include: { product: true, warehouse: true },
    });

    if (!stock) throw new AppError('Stock item not found', 404);

    const newQuantity = stock.quantity + change;

    if (newQuantity < 0) {
      throw new AppError(`Cannot adjust stock below 0. Current: ${stock.quantity}, Change: ${change}`, 400);
    }

    if (newQuantity < stock.reservedQty) {
      throw new AppError(
        `Quantity on hand (${newQuantity}) cannot be less than reserved quantity (${stock.reservedQty})`,
        400
      );
    }

    return tx.warehouseStock.update({
      where: { id },
      data: { quantity: newQuantity },
      include: { product: true, warehouse: true },
    });
  }, { maxWait: 15000, timeout: 60000 });

  await logAudit({
    userId: user?.id,
    action: 'INVENTORY_ADJUSTED',
    entityType: 'WAREHOUSE_STOCK',
    entityId: id,
    oldValues: { quantityChange: change, reason, type },
    newValues: { newQuantity: updated.quantity },
  });

  return {
    ...updated,
    quantityOnHand: updated.quantity,
    quantityReserved: updated.reservedQty,
    availableQuantity: Math.max(0, updated.quantity - updated.reservedQty),
  };
};

exports.adjustStock = exports.adjust;

exports.reserve = async ({ warehouseId, productId, quantity } = {}, user = null) => {
  const qty = parseInt(quantity, 10);
  if (!qty || qty <= 0) throw new AppError('Quantity must be greater than zero', 400);

  return prisma.$transaction(async (tx) => {
    const stock = await tx.warehouseStock.findUnique({
      where: { warehouseId_productId: { warehouseId, productId } },
    });

    if (!stock) throw new AppError('Stock item not found for specified warehouse and product', 404);

    const available = stock.quantity - stock.reservedQty;
    if (available < qty) {
      throw new AppError(
        `Insufficient stock to reserve. Requested: ${qty}, Available: ${available} (OnHand: ${stock.quantity}, Reserved: ${stock.reservedQty})`,
        400
      );
    }

    const updated = await tx.warehouseStock.update({
      where: { id: stock.id },
      data: { reservedQty: { increment: qty } },
    });

    await logAudit({
      userId: user?.id,
      action: 'INVENTORY_RESERVED',
      entityType: 'WAREHOUSE_STOCK',
      entityId: stock.id,
      newValues: { reservedIncrement: qty, totalReserved: updated.reservedQty },
    });

    return updated;
  });
};

exports.release = async ({ warehouseId, productId, quantity } = {}, user = null) => {
  const qty = parseInt(quantity, 10);
  if (!qty || qty <= 0) throw new AppError('Quantity must be greater than zero', 400);

  return prisma.$transaction(async (tx) => {
    const stock = await tx.warehouseStock.findUnique({
      where: { warehouseId_productId: { warehouseId, productId } },
    });

    if (!stock) throw new AppError('Stock item not found', 404);

    const toRelease = Math.min(stock.reservedQty, qty);

    const updated = await tx.warehouseStock.update({
      where: { id: stock.id },
      data: { reservedQty: { decrement: toRelease } },
    });

    await logAudit({
      userId: user?.id,
      action: 'INVENTORY_RELEASED',
      entityType: 'WAREHOUSE_STOCK',
      entityId: stock.id,
      newValues: { released: toRelease, remainingReserved: updated.reservedQty },
    });

    return updated;
  });
};
