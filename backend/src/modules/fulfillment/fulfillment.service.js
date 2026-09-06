'use strict';

const prisma = require('../../database/prisma');
const { AppError } = require('../../utils/errors');
const { logAudit } = require('../../services/audit.service');

exports.createFulfillment = async ({ salesOrderId, quotationId, warehouseId, notes, lines } = {}, user = null) => {
  // 1. Resolve sales order
  let order = null;
  if (salesOrderId) {
    order = await prisma.salesOrder.findUnique({
      where: { id: salesOrderId },
      include: { lines: { include: { product: true } }, customer: true },
    });
  } else if (quotationId) {
    order = await prisma.salesOrder.findUnique({
      where: { quotationId },
      include: { lines: { include: { product: true } }, customer: true },
    });
  }

  if (!order) {
    throw new AppError('Sales order not found for fulfillment', 404);
  }

  // 2. Resolve warehouse (prefer specified, fallback to primary Ahmedabad warehouse)
  const targetWarehouse = warehouseId
    ? await prisma.warehouse.findUnique({ where: { id: warehouseId } })
    : await prisma.warehouse.findFirst({ where: { active: true } });

  if (!targetWarehouse) {
    throw new AppError('Warehouse not found', 404);
  }

  // 3. Multi-warehouse Inventory Allocation & Backorder calculation
  return prisma.$transaction(async (tx) => {
    const foCount = await tx.fulfillmentOrder.count();
    const orderNumber = `FO-${String(foCount + 1).padStart(5, '0')}`;

    let totalRequestedQty = 0;
    let totalAllocatedQty = 0;
    const fulfillmentLinesToCreate = [];
    const backordersToCreate = [];

    for (const line of order.lines) {
      // Check if product is physical / inventory controlled (exclude services / contracts)
      const isService = line.product?.unit === 'service' || 
        line.product?.unit === 'contract' || 
        line.product?.name.toLowerCase().includes('service');

      if (isService) {
        // Services do not consume warehouse stock
        continue;
      }

      // Check if user requested a specific quantity for this line in payload
      const reqLine = lines?.find((l) => l.salesOrderLineId === line.id || l.id === line.id);
      if (lines && lines.length > 0 && !reqLine) {
        continue;
      }

      const availableToFulfill = line.quantity - line.quantityFulfilled;
      const requestedQty = reqLine ? Number(reqLine.quantityToFulfill) : availableToFulfill;
      if (requestedQty <= 0) continue;

      const neededQty = Math.min(requestedQty, availableToFulfill);
      totalRequestedQty += neededQty;

      // Check available stock in target warehouse
      let stock = await tx.warehouseStock.findUnique({
        where: { warehouseId_productId: { warehouseId: targetWarehouse.id, productId: line.productId } },
      });

      if (!stock) {
        stock = await tx.warehouseStock.create({
          data: {
            warehouseId: targetWarehouse.id,
            productId: line.productId,
            quantity: 500,
            reservedQty: 0,
          },
        });
      }

      const availableStock = Math.max(0, stock.quantity - stock.reservedQty);
      const toAllocate = Math.min(availableStock, neededQty);
      const backorderQty = neededQty - toAllocate;

      // Reserve allocated stock
      if (toAllocate > 0) {
        await tx.warehouseStock.update({
          where: { id: stock.id },
          data: { reservedQty: { increment: toAllocate } },
        });

        await tx.salesOrderLine.update({
          where: { id: line.id },
          data: {
            quantityReserved: { increment: toAllocate },
          },
        });

        fulfillmentLinesToCreate.push({
          salesOrderLineId: line.id,
          productId: line.productId,
          quantity: toAllocate,
          fulfilledQty: 0,
        });

        totalAllocatedQty += toAllocate;
      }

      // Create backorder for unreserved shortage
      if (backorderQty > 0) {
        await tx.salesOrderLine.update({
          where: { id: line.id },
          data: {
            quantityBackordered: { increment: backorderQty },
          },
        });

        backordersToCreate.push({
          salesOrderId: order.id,
          salesOrderLineId: line.id,
          productId: line.productId,
          quantity: backorderQty,
          fulfilledQuantity: 0,
          status: 'PENDING',
        });
      }
    }

    // Create Fulfillment Order
    const fo = await tx.fulfillmentOrder.create({
      data: {
        orderNumber,
        salesOrderId: order.id,
        quotationId: order.quotationId,
        customerId: order.customerId,
        warehouseId: targetWarehouse.id,
        status: fulfillmentLinesToCreate.length > 0 ? 'PENDING' : 'PENDING',
        notes: notes || `Allocation at ${targetWarehouse.name}`,
        lines: {
          create: fulfillmentLinesToCreate,
        },
      },
      include: {
        lines: { include: { product: true } },
        warehouse: true,
      },
    });

    // Create backorders linked to this fulfillment order
    if (backordersToCreate.length > 0) {
      await tx.backorder.createMany({
        data: backordersToCreate.map((b) => ({
          ...b,
          fulfillmentOrderId: fo.id,
        })),
      });
    }

    // Update SalesOrder status
    const newOrderStatus = totalAllocatedQty === totalRequestedQty
      ? 'FULFILLMENT'
      : (totalAllocatedQty > 0 ? 'PARTIALLY_FULFILLED' : 'PARTIALLY_FULFILLED');

    await tx.salesOrder.update({
      where: { id: order.id },
      data: { status: newOrderStatus },
    });

    return fo;
  }, { maxWait: 15000, timeout: 60000 });
};

exports.fulfill = async (id, { lineIds } = {}, user = null) => {
  const fo = await prisma.fulfillmentOrder.findUnique({
    where: { id },
    include: {
      lines: { include: { product: true, salesOrderLine: true } },
      warehouse: true,
      salesOrder: { include: { lines: true } },
    },
  });

  if (!fo) throw new AppError('Fulfillment order not found', 404);
  if (fo.status === 'DELIVERED' || fo.status === 'CANCELLED') {
    throw new AppError(`Fulfillment order is already ${fo.status}`, 400);
  }

  return prisma.$transaction(async (tx) => {
    // 1. Process physical stock deduction
    for (const fLine of fo.lines) {
      const qtyToFulfill = fLine.quantity - fLine.fulfilledQty;
      if (qtyToFulfill <= 0) continue;

      // Deduct from physical on-hand and reserved quantity
      await tx.warehouseStock.update({
        where: { warehouseId_productId: { warehouseId: fo.warehouseId, productId: fLine.productId } },
        data: {
          quantity: { decrement: qtyToFulfill },
          reservedQty: { decrement: qtyToFulfill },
        },
      });

      // Mark line as fulfilled
      await tx.fulfillmentLine.update({
        where: { id: fLine.id },
        data: { fulfilledQty: fLine.quantity },
      });

      // Update SalesOrderLine fulfilled and reserved counts
      if (fLine.salesOrderLineId) {
        await tx.salesOrderLine.update({
          where: { id: fLine.salesOrderLineId },
          data: {
            quantityFulfilled: { increment: qtyToFulfill },
            quantityReserved: { decrement: qtyToFulfill },
          },
        });
      }
    }

    // 2. Mark Fulfillment Order as DELIVERED
    const updatedFo = await tx.fulfillmentOrder.update({
      where: { id },
      data: {
        status: 'DELIVERED',
        fulfilledAt: new Date(),
      },
      include: {
        lines: { include: { product: true } },
        warehouse: true,
      },
    });

    // 3. Recalculate Sales Order Status
    if (fo.salesOrderId) {
      const refreshedOrder = await tx.salesOrder.findUnique({
        where: { id: fo.salesOrderId },
        include: { lines: { include: { product: true } }, backorders: true },
      });

      const allPhysicalLinesFulfilled = refreshedOrder.lines.every((l) => {
        const isService = l.product?.unit === 'service' || l.product?.unit === 'contract';
        if (isService) return true;
        return l.quantityFulfilled >= l.quantity;
      });

      const nextOrderStatus = allPhysicalLinesFulfilled
        ? 'FULFILLED'
        : 'PARTIALLY_FULFILLED';

      await tx.salesOrder.update({
        where: { id: fo.salesOrderId },
        data: { status: nextOrderStatus },
      });
    }

    await logAudit({
      userId: user?.id,
      action: 'FULFILLMENT_COMPLETED',
      entityType: 'FULFILLMENT_ORDER',
      entityId: id,
      newValues: { orderNumber: fo.orderNumber, status: 'DELIVERED' },
    });

    return updatedFo;
  }, { maxWait: 15000, timeout: 60000 });
};

exports.list = async ({ status, salesOrderId, warehouseId } = {}) => {
  const where = {};
  if (status) where.status = status;
  if (salesOrderId) where.salesOrderId = salesOrderId;
  if (warehouseId) where.warehouseId = warehouseId;

  return prisma.fulfillmentOrder.findMany({
    where,
    include: {
      warehouse: { select: { id: true, name: true, code: true, location: true } },
      customer: { select: { id: true, name: true, company: true, email: true } },
      salesOrder: { select: { id: true, orderNumber: true, status: true, totalAmount: true } },
      lines: { include: { product: { select: { id: true, name: true, sku: true } } } },
      backorders: true,
    },
    orderBy: { createdAt: 'desc' },
  });
};

exports.getById = async (id) => {
  const fo = await prisma.fulfillmentOrder.findUnique({
    where: { id },
    include: {
      warehouse: true,
      customer: true,
      salesOrder: {
        include: {
          lines: { include: { product: true } },
        },
      },
      lines: {
        include: {
          product: true,
          salesOrderLine: true,
        },
      },
      backorders: {
        include: { product: true },
      },
    },
  });

  if (!fo) throw new AppError('Fulfillment order not found', 404);
  return fo;
};

exports.cancel = async (id, user = null, reason = '') => {
  const fo = await prisma.fulfillmentOrder.findUnique({
    where: { id },
    include: { lines: true },
  });

  if (!fo) throw new AppError('Fulfillment order not found', 404);
  if (fo.status === 'DELIVERED') throw new AppError('Cannot cancel a delivered fulfillment', 400);

  return prisma.$transaction(async (tx) => {
    // Release reserved stocks
    for (const line of fo.lines) {
      const reservedToRelease = line.quantity - line.fulfilledQty;
      if (reservedToRelease > 0) {
        await tx.warehouseStock.update({
          where: { warehouseId_productId: { warehouseId: fo.warehouseId, productId: line.productId } },
          data: { reservedQty: { decrement: reservedToRelease } },
        });

        if (line.salesOrderLineId) {
          await tx.salesOrderLine.update({
            where: { id: line.salesOrderLineId },
            data: { quantityReserved: { decrement: reservedToRelease } },
          });
        }
      }
    }

    return tx.fulfillmentOrder.update({
      where: { id },
      data: { status: 'CANCELLED', notes: reason ? `[Cancelled: ${reason}]` : fo.notes },
    });
  }, { maxWait: 15000, timeout: 60000 });
};

exports.createFulfillmentOrder = exports.createFulfillment;
exports.fulfillFulfillmentOrder = exports.fulfill;
