'use strict';

const prisma = require('../../database/prisma');

exports.getOperationsKPIs = async () => {
  const [
    totalOrders,
    ordersAwaitingFulfillment,
    partiallyFulfilledOrders,
    fulfilledOrders,
    openBackordersCount,
    backordersAgg,
    warehouseStocks,
    outstandingInvoicesCount,
    invoicesAgg,
    paidInvoicesCount,
    paymentsAgg,
    activeSubscriptionsCount,
    subscriptionsWithLines,
  ] = await Promise.all([
    prisma.salesOrder.count(),
    prisma.salesOrder.count({ where: { status: { in: ['ORDER_CONFIRMED', 'PENDING'] } } }),
    prisma.salesOrder.count({ where: { status: 'PARTIALLY_FULFILLED' } }),
    prisma.salesOrder.count({ where: { status: 'FULFILLED' } }),
    prisma.backorder.count({ where: { status: { in: ['PENDING', 'OPEN', 'PARTIALLY_FULFILLED', 'PENDING_RESTOCK'] } } }),
    prisma.backorder.aggregate({
      where: { status: { in: ['PENDING', 'OPEN', 'PARTIALLY_FULFILLED', 'PENDING_RESTOCK'] } },
      _sum: { quantity: true, fulfilledQuantity: true },
    }),
    prisma.warehouseStock.findMany({
      include: {
        product: { select: { costPrice: true, basePrice: true, name: true, sku: true } },
        warehouse: { select: { name: true, code: true } },
      },
    }),
    prisma.invoice.count({ where: { status: { in: ['PENDING', 'PARTIAL'] } } }),
    prisma.invoice.aggregate({
      where: { status: { in: ['PENDING', 'PARTIAL'] } },
      _sum: { balanceDue: true, totalAmount: true },
    }),
    prisma.invoice.count({ where: { status: 'PAID' } }),
    prisma.payment.aggregate({
      where: { status: { in: ['PAID', 'PARTIAL'] } },
      _sum: { amount: true },
    }),
    prisma.subscription.count({ where: { status: 'ACTIVE' } }),
    prisma.subscription.findMany({
      where: { status: 'ACTIVE' },
      include: { lines: true },
    }),
  ]);

  // Compute inventory valuation and low stock items
  let totalInventoryValue = 0;
  let totalQuantityOnHand = 0;
  let totalQuantityReserved = 0;
  let lowStockCount = 0;

  for (const s of warehouseStocks) {
    const qty = Number.isFinite(Number(s.quantity)) ? Number(s.quantity) : 0;
    const reserved = Number.isFinite(Number(s.reservedQty)) ? Number(s.reservedQty) : 0;
    const cost = Number.isFinite(Number(s.product?.costPrice))
      ? Number(s.product.costPrice)
      : (Number.isFinite(Number(s.product?.basePrice)) ? Number(s.product.basePrice) : 0);
    totalInventoryValue += qty * cost;
    totalQuantityOnHand += qty;
    totalQuantityReserved += reserved;
    const reorder = Number.isFinite(Number(s.reorderLevel)) ? Number(s.reorderLevel) : 0;
    if (qty <= reorder) {
      lowStockCount++;
    }
  }

  // Compute Monthly Recurring Revenue (MRR)
  let mrr = 0;
  for (const sub of subscriptionsWithLines) {
    for (const l of sub.lines) {
      mrr += Number.isFinite(Number(l.lineTotal)) ? Number(l.lineTotal) : 0;
    }
  }

  const toSafe = (val, fallback = 0) => {
    const n = Number(val);
    return Number.isFinite(n) ? n : fallback;
  };

  const outstandingBalance = toSafe(invoicesAgg._sum.balanceDue);
  const totalCollected = toSafe(paymentsAgg._sum.amount);
  const backorderUnits = toSafe(backordersAgg._sum.quantity) - toSafe(backordersAgg._sum.fulfilledQuantity);

  return {
    totalOrders: toSafe(totalOrders),
    ordersAwaitingFulfillment: toSafe(ordersAwaitingFulfillment),
    partiallyFulfilledOrders: toSafe(partiallyFulfilledOrders),
    fulfilledOrders: toSafe(fulfilledOrders),
    openBackorders: toSafe(openBackordersCount),
    openBackordersQuantity: Math.max(0, toSafe(backorderUnits)),
    lowStockProducts: toSafe(lowStockCount),
    totalInventoryValue: Number(toSafe(totalInventoryValue).toFixed(2)),
    totalQuantityOnHand: toSafe(totalQuantityOnHand),
    totalQuantityReserved: toSafe(totalQuantityReserved),
    availableStockQuantity: Math.max(0, toSafe(totalQuantityOnHand) - toSafe(totalQuantityReserved)),
    outstandingInvoices: toSafe(outstandingInvoicesCount),
    outstandingBalance: Number(toSafe(outstandingBalance).toFixed(2)),
    paidInvoices: toSafe(paidInvoicesCount),
    totalCollectedRevenue: Number(toSafe(totalCollected).toFixed(2)),
    activeSubscriptions: toSafe(activeSubscriptionsCount),
    monthlyRecurringRevenue: Number(toSafe(mrr).toFixed(2)),
  };
};

exports.getOperationsAnalytics = async () => {
  const [orders, fulfillments, backorders] = await Promise.all([
    prisma.salesOrder.findMany({
      select: { id: true, status: true, totalAmount: true, createdAt: true },
    }),
    prisma.fulfillmentOrder.findMany({
      select: { id: true, status: true, warehouse: { select: { name: true } } },
    }),
    prisma.backorder.findMany({
      include: { product: { select: { name: true, sku: true } } },
    }),
  ]);

  // Group orders by status
  const ordersByStatus = orders.reduce((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    return acc;
  }, {});

  // Group fulfillments by status
  const fulfillmentsByStatus = fulfillments.reduce((acc, f) => {
    acc[f.status] = (acc[f.status] || 0) + 1;
    return acc;
  }, {});

  return {
    ordersByStatus,
    fulfillmentsByStatus,
    openBackordersList: backorders.map((b) => ({
      id: b.id,
      productName: b.product?.name,
      sku: b.product?.sku,
      quantity: b.quantity,
      fulfilledQuantity: b.fulfilledQuantity,
      status: b.status,
    })),
  };
};

exports.getInventoryAnalytics = async () => {
  const warehouses = await prisma.warehouse.findMany({
    where: { active: true },
    include: {
      stocks: {
        include: { product: true },
      },
    },
  });

  const warehouseBreakdown = warehouses.map((w) => {
    let totalStock = 0;
    let totalReserved = 0;
    let valuation = 0;

    const items = w.stocks.map((s) => {
      const qty = Number.isFinite(Number(s.quantity)) ? Number(s.quantity) : 0;
      const reserved = Number.isFinite(Number(s.reservedQty)) ? Number(s.reservedQty) : 0;
      const cost = Number.isFinite(Number(s.product?.costPrice))
        ? Number(s.product.costPrice)
        : (Number.isFinite(Number(s.product?.basePrice)) ? Number(s.product.basePrice) : 0);
      const val = Number((qty * cost).toFixed(2));
      totalStock += qty;
      totalReserved += reserved;
      valuation += val;
      return {
        productName: s.product?.name || 'Unnamed',
        sku: s.product?.sku || 'N/A',
        quantity: qty,
        quantityOnHand: qty,
        reserved: reserved,
        reservedQty: reserved,
        available: Math.max(0, qty - reserved),
        unitCost: cost,
        value: val,
      };
    });

    return {
      warehouseId: w.id,
      name: w.name,
      code: w.code,
      totalUnits: totalStock,
      reservedUnits: totalReserved,
      availableUnits: Math.max(0, totalStock - totalReserved),
      valuation: Number(valuation.toFixed(2)),
      itemCount: items.length,
      items,
    };
  });

  return {
    warehouses: warehouseBreakdown,
  };
};

exports.getBillingAnalytics = async () => {
  const [invoices, payments, subscriptions] = await Promise.all([
    prisma.invoice.findMany({
      select: { id: true, invoiceNumber: true, totalAmount: true, amountPaid: true, balanceDue: true, status: true, dueDate: true },
    }),
    prisma.payment.findMany({
      select: { id: true, amount: true, method: true, status: true, paidAt: true },
      orderBy: { paidAt: 'desc' },
      take: 20,
    }),
    prisma.subscription.findMany({
      select: { id: true, subscriptionNumber: true, status: true, plan: { select: { name: true, interval: true } } },
    }),
  ]);

  const invoicesByStatus = invoices.reduce((acc, inv) => {
    acc[inv.status] = (acc[inv.status] || 0) + 1;
    return acc;
  }, {});

  const totalInvoiced = invoices.reduce((sum, i) => sum + Number(i.totalAmount), 0);
  const totalPaid = invoices.reduce((sum, i) => sum + Number(i.amountPaid), 0);
  const totalDue = invoices.reduce((sum, i) => sum + Number(i.balanceDue), 0);

  return {
    invoicesByStatus,
    totalInvoiced: Number(totalInvoiced.toFixed(2)),
    totalPaid: Number(totalPaid.toFixed(2)),
    totalDue: Number(totalDue.toFixed(2)),
    recentPayments: payments.map((p) => ({
      id: p.id,
      amount: Number(p.amount),
      method: p.method,
      status: p.status,
      paidAt: p.paidAt,
    })),
    activeSubscriptionsCount: subscriptions.filter((s) => s.status === 'ACTIVE').length,
  };
};

exports.getRevenueAnalytics = async () => {
  const orders = await prisma.salesOrder.findMany({
    select: { id: true, totalAmount: true, createdAt: true, status: true },
  });

  // Group revenue by month
  const monthlyRevenue = {};
  for (const o of orders) {
    if (o.status !== 'CANCELLED') {
      const monthKey = new Date(o.createdAt).toISOString().slice(0, 7); // YYYY-MM
      monthlyRevenue[monthKey] = (monthlyRevenue[monthKey] || 0) + Number(o.totalAmount);
    }
  }

  const trend = Object.keys(monthlyRevenue).sort().map((m) => ({
    month: m,
    revenue: Number(monthlyRevenue[m].toFixed(2)),
  }));

  return {
    monthlyTrend: trend,
  };
};
