'use strict';

const prisma = require('../../database/prisma');
const { AppError } = require('../../utils/errors');
const { logAudit } = require('../../services/audit.service');

const { parsePagination, paginateResult } = require('../../utils/pagination');

exports.list = async (query = {}) => {
  const { status, salesOrderId, search } = query;
  const { page, limit, skip, take } = parsePagination(query, { defaultLimit: 10, maxLimit: 100 });

  const where = {};
  if (status) where.status = status;
  if (salesOrderId) where.salesOrderId = salesOrderId;

  if (search) {
    const trimmed = String(search).trim();
    if (trimmed) {
      where.OR = [
        { product: { name: { contains: trimmed, mode: 'insensitive' } } },
        { product: { sku: { contains: trimmed, mode: 'insensitive' } } },
        { salesOrder: { orderNumber: { contains: trimmed, mode: 'insensitive' } } },
      ];
    }
  }

  const [total, items] = await Promise.all([
    prisma.backorder.count({ where }),
    prisma.backorder.findMany({
      where,
      include: {
        product: { select: { id: true, name: true, sku: true, costPrice: true, basePrice: true } },
        salesOrder: { select: { id: true, orderNumber: true, status: true, customer: true } },
        fulfillmentOrder: { select: { id: true, orderNumber: true, warehouse: true } },
        salesOrderLine: true,
      },
      orderBy: { createdAt: 'desc' },
      take,
      skip,
    }),
  ]);

  return paginateResult(items, total, page, limit);
};

exports.getById = async (id) => {
  const backorder = await prisma.backorder.findUnique({
    where: { id },
    include: {
      product: true,
      salesOrder: { include: { customer: true, lines: true } },
      fulfillmentOrder: { include: { warehouse: true } },
      salesOrderLine: true,
    },
  });

  if (!backorder) throw new AppError('Backorder not found', 404);
  return backorder;
};

exports.fulfill = async (id, { quantity, warehouseId } = {}, user = null) => {
  const backorder = await prisma.backorder.findUnique({
    where: { id },
    include: {
      product: true,
      salesOrder: { include: { lines: { include: { product: true } } } },
      fulfillmentOrder: { include: { warehouse: true } },
      salesOrderLine: true,
    },
  });

  if (!backorder) throw new AppError('Backorder not found', 404);
  if (backorder.status === 'FULFILLED') {
    throw new AppError('Backorder is already completely fulfilled', 400);
  }

  const remainingNeeded = backorder.quantity - backorder.fulfilledQuantity;
  const toFulfill = quantity ? Math.min(parseInt(quantity, 10), remainingNeeded) : remainingNeeded;

  if (toFulfill <= 0) {
    throw new AppError('Invalid quantity to fulfill', 400);
  }

  // Target warehouse
  const targetWarehouseId = warehouseId || backorder.fulfillmentOrder?.warehouseId ||
    (await prisma.warehouse.findFirst({ where: { active: true } }))?.id;

  if (!targetWarehouseId) throw new AppError('Warehouse not found', 404);

  return prisma.$transaction(async (tx) => {
    // 1. Check stock in warehouse
    const stock = await tx.warehouseStock.findUnique({
      where: { warehouseId_productId: { warehouseId: targetWarehouseId, productId: backorder.productId } },
    });

    const available = stock ? (stock.quantity - stock.reservedQty) : 0;
    if (available < toFulfill) {
      throw new AppError(
        `Insufficient available stock in warehouse to fulfill backorder. Required: ${toFulfill}, Available: ${available}`,
        400
      );
    }

    // 2. Deduct physical stock
    await tx.warehouseStock.update({
      where: { id: stock.id },
      data: { quantity: { decrement: toFulfill } },
    });

    // 3. Update Backorder record
    const updatedBackorder = await tx.backorder.update({
      where: { id },
      data: {
        fulfilledQuantity: { increment: toFulfill },
        status: (backorder.fulfilledQuantity + toFulfill) >= backorder.quantity ? 'FULFILLED' : 'PARTIALLY_FULFILLED',
      },
      include: { product: true, salesOrder: true },
    });

    // 4. Update SalesOrderLine
    if (backorder.salesOrderLineId) {
      await tx.salesOrderLine.update({
        where: { id: backorder.salesOrderLineId },
        data: {
          quantityFulfilled: { increment: toFulfill },
          quantityBackordered: { decrement: toFulfill },
        },
      });
    }

    // 5. Recalculate Sales Order Status
    if (backorder.salesOrderId) {
      const refreshedOrder = await tx.salesOrder.findUnique({
        where: { id: backorder.salesOrderId },
        include: { lines: { include: { product: true } } },
      });

      const allPhysicalLinesFulfilled = refreshedOrder.lines.every((l) => {
        const isService = l.product?.unit === 'service' || l.product?.unit === 'contract';
        if (isService) return true;
        return l.quantityFulfilled >= l.quantity;
      });

      if (allPhysicalLinesFulfilled) {
        await tx.salesOrder.update({
          where: { id: backorder.salesOrderId },
          data: { status: 'FULFILLED' },
        });
      }
    }

    await logAudit({
      userId: user?.id,
      action: 'BACKORDER_FULFILLED',
      entityType: 'BACKORDER',
      entityId: id,
      newValues: {
        fulfilledQty: toFulfill,
        status: updatedBackorder.status,
      },
    });

    return Object.assign(updatedBackorder, { backorder: updatedBackorder });
  }, { maxWait: 15000, timeout: 60000 });
};

exports.fulfillBackorder = exports.fulfill;
