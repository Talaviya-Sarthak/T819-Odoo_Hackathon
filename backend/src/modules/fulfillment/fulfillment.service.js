'use strict';

const { PrismaClient } = require('@prisma/client');
const { AppError } = require('../../utils/errors');

const prisma = new PrismaClient();

exports.getFulfillment = async (quotationId) => {
  const quotation = await prisma.quotation.findUnique({ where: { id: quotationId } });
  if (!quotation) throw new AppError('Quotation not found', 404);

  return prisma.fulfillmentOrder.findMany({
    where: { quotationId },
    include: {
      warehouse: true,
      lines: { include: { quotationLine: { include: { product: true } } } },
    },
    orderBy: { createdAt: 'desc' },
  });
};

exports.allocate = async (quotationId, { warehouseId, lines }) => {
  const quotation = await prisma.quotation.findUnique({
    where: { id: quotationId },
    include: { lines: true },
  });
  if (!quotation) throw new AppError('Quotation not found', 404);
  if (!['ORDER_CONFIRMED', 'FULFILLMENT', 'PARTIALLY_FULFILLED'].includes(quotation.status)) {
    throw new AppError('Quotation must be order confirmed before allocation', 400);
  }

  const warehouse = await prisma.warehouse.findUnique({ where: { id: warehouseId } });
  if (!warehouse) throw new AppError('Warehouse not found', 404);

  for (const line of lines) {
    const stock = await prisma.warehouseStock.findUnique({
      where: { warehouseId_productId: { warehouseId, productId: line.productId } },
    });
    if (!stock || stock.availableQuantity < line.quantity) {
      throw new AppError(`Insufficient stock for product ${line.productId}`, 400);
    }
  }

  const fulfillmentOrder = await prisma.$transaction(async (tx) => {
    const order = await tx.fulfillmentOrder.create({
      data: {
        quotationId,
        warehouseId,
        status: 'ALLOCATED',
        lines: {
          create: lines.map((line) => ({
            quantity: line.quantity,
            quotationLineId: line.quotationLineId,
          })),
        },
      },
      include: { lines: true },
    });

    for (const line of lines) {
      await tx.warehouseStock.update({
        where: { warehouseId_productId: { warehouseId, productId: line.productId } },
        data: {
          availableQuantity: { decrement: line.quantity },
          reservedQuantity: { increment: line.quantity },
        },
      });
    }

    const hasMoreUnfulfilled = quotation.lines.some((ql) => {
      const allocated = lines.filter((l) => l.quotationLineId === ql.id)
        .reduce((sum, l) => sum + l.quantity, 0);
      return allocated < ql.quantity;
    });

    await tx.quotation.update({
      where: { id: quotationId },
      data: { status: hasMoreUnfulfilled ? 'PARTIALLY_FULFILLED' : 'FULFILLMENT' },
    });

    return order;
  });

  return fulfillmentOrder;
};

exports.override = async (quotationId, { warehouseId, lines }) => {
  const quotation = await prisma.quotation.findUnique({ where: { id: quotationId } });
  if (!quotation) throw new AppError('Quotation not found', 404);

  const warehouse = await prisma.warehouse.findUnique({ where: { id: warehouseId } });
  if (!warehouse) throw new AppError('Warehouse not found', 404);

  const order = await prisma.fulfillmentOrder.create({
    data: {
      quotationId,
      warehouseId,
      status: 'ALLOCATED',
      lines: {
        create: lines.map((line) => ({
          quantity: line.quantity,
          quotationLineId: line.quotationLineId,
        })),
      },
    },
    include: { lines: true },
  });

  for (const line of lines) {
    const stock = await prisma.warehouseStock.findUnique({
      where: { warehouseId_productId: { warehouseId, productId: line.productId } },
    });
    if (stock) {
      await prisma.warehouseStock.update({
        where: { warehouseId_productId: { warehouseId, productId: line.productId } },
        data: {
          availableQuantity: { decrement: line.quantity },
          reservedQuantity: { increment: line.quantity },
        },
      });
    }
  }

  return order;
};
