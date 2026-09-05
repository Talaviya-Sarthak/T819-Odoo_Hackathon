'use strict';

const { AppError } = require('../../utils/errors');
const { logAudit } = require('../../services/audit.service');
const prisma = require('../../database/prisma');

exports.list = async ({ user, tierId, search, limit = 50, offset = 0 } = {}) => {
  const conditions = [];

  // Customer role can ONLY view their own customer record
  if (user && user.role === 'CUSTOMER') {
    if (user.customer_id) {
      conditions.push({ id: user.customer_id });
    } else {
      const cust = await prisma.customer.findFirst({
        where: { OR: [{ email: user.email }, { ownerId: user.id }] },
      });
      if (cust) conditions.push({ id: cust.id });
      else return [];
    }
  } else if (user && user.role === 'SALES_REP') {
    // Sales rep sees assigned customers or unassigned
    conditions.push({
      OR: [
        { salesRepId: user.id },
        { ownerId: user.id },
        { salesRepId: null },
      ],
    });
  }

  if (tierId) conditions.push({ tierId });
  if (search) {
    conditions.push({
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { company: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ],
    });
  }

  const where = conditions.length > 0 ? { AND: conditions } : {};

  return prisma.customer.findMany({
    where,
    include: {
      tier: true,
      salesRep: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: Number(limit),
    skip: Number(offset),
  });
};

exports.getById = async (id, user = null) => {
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      tier: true,
      salesRep: { select: { id: true, name: true, email: true } },
      quotations: {
        select: { id: true, quotationNumber: true, status: true, totalAmount: true, createdAt: true },
        take: 10,
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!customer) throw new AppError('Customer not found', 404);

  // Security Check: Customer isolation
  if (user && user.role === 'CUSTOMER') {
    const isOwnCustomer = customer.id === user.customer_id || 
      (customer.email && customer.email.toLowerCase() === user.email.toLowerCase()) ||
      customer.ownerId === user.id;

    if (!isOwnCustomer) {
      throw new AppError('Access denied. You can only access your own customer record.', 403);
    }
  }

  // Security Check: Sales rep isolation
  if (user && user.role === 'SALES_REP') {
    const isAssigned = customer.salesRepId === user.id || customer.ownerId === user.id;
    if (!isAssigned) {
      throw new AppError('Access denied. Customer is not assigned to you.', 403);
    }
  }

  return customer;
};

exports.create = async (data, user = null) => {
  if (!data.name) throw new AppError('Customer name is required', 400);

  // If created by sales rep, assign to themselves automatically
  let salesRepId = data.salesRepId;
  if (user && user.role === 'SALES_REP') {
    salesRepId = user.id;
  }

  const customer = await prisma.customer.create({
    data: {
      name: data.name,
      company: data.company || null,
      email: data.email || null,
      phone: data.phone || null,
      address: data.address || null,
      currency: data.currency || 'USD',
      tierId: data.tierId || null,
      salesRepId: salesRepId || null,
      ownerId: user ? user.id : null,
    },
    include: {
      tier: true,
      salesRep: { select: { id: true, name: true, email: true } },
    },
  });

  await logAudit({
    userId: user?.id,
    action: 'CUSTOMER_CREATE',
    entityType: 'CUSTOMER',
    entityId: customer.id,
    newValues: { name: customer.name, email: customer.email, tierId: customer.tierId },
  });

  return customer;
};

exports.update = async (id, data, user = null) => {
  const existing = await prisma.customer.findUnique({ where: { id } });
  if (!existing) throw new AppError('Customer not found', 404);

  // Authorization checks
  if (user && user.role === 'CUSTOMER') {
    const isOwnCustomer = existing.id === user.customer_id || 
      (existing.email && existing.email.toLowerCase() === user.email.toLowerCase()) ||
      existing.ownerId === user.id;
    if (!isOwnCustomer) throw new AppError('Access denied', 403);

    // Customers cannot modify their own tier or assigned sales rep
    delete data.tierId;
    delete data.salesRepId;
    delete data.ownerId;
  }

  if (user && user.role === 'SALES_REP') {
    const isAssigned = existing.salesRepId === user.id || existing.ownerId === user.id;
    if (!isAssigned) throw new AppError('Access denied. Customer not assigned to you.', 403);
  }

  const updateData = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.company !== undefined) updateData.company = data.company;
  if (data.email !== undefined) updateData.email = data.email;
  if (data.phone !== undefined) updateData.phone = data.phone;
  if (data.address !== undefined) updateData.address = data.address;
  if (data.currency !== undefined) updateData.currency = data.currency;
  if (data.tierId !== undefined) updateData.tierId = data.tierId;
  if (data.salesRepId !== undefined) updateData.salesRepId = data.salesRepId;

  const updated = await prisma.customer.update({
    where: { id },
    data: updateData,
    include: {
      tier: true,
      salesRep: { select: { id: true, name: true, email: true } },
    },
  });

  await logAudit({
    userId: user?.id,
    action: 'CUSTOMER_UPDATE',
    entityType: 'CUSTOMER',
    entityId: id,
    oldValues: { name: existing.name, tierId: existing.tierId },
    newValues: updateData,
  });

  return updated;
};

exports.listTiers = async () => {
  return prisma.customerTier.findMany({
    orderBy: { discountPct: 'asc' },
  });
};
