'use strict';

const { PrismaClient } = require('@prisma/client');
const { AppError } = require('../../utils/errors');
const { logAudit } = require('../../services/audit.service');
const { generateKey, cache } = require('../../cache');
const prisma = require('../../database/prisma');

const CUSTOMERS_LIST_TTL = 60; // 1 minute

exports.list = async ({ user, tierId, search, limit = 50, offset = 0 } = {}) => {
  const where = {};
  if (tierId) where.tierId = tierId;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { company: { contains: search, mode: 'insensitive' } },
    ];
  }

  // If customer role, only return their own customer profile
  if (user && user.role === 'CUSTOMER') {
    const custId = user.customerId || user.customer_id;
    if (custId) {
      where.id = custId;
    } else {
      where.OR = [{ email: user.email }, { ownerId: user.id }];
    }
  }

  // If sales rep role, only show assigned customers
  if (user && user.role === 'SALES_REP') {
    where.OR = [{ salesRepId: user.id }, { ownerId: user.id }];
  }

  const cacheKey = generateKey(
    'customers:list',
    user?.id,
    user?.role,
    tierId,
    search,
    limit,
    offset
  );

  // Check cache first
  const cached = cache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const result = await prisma.customer.findMany({
    where,
    include: {
      tier: true,
      salesRep: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: Number(limit) || 50,
    skip: Number(offset) || 0,
  });

  // Store in cache with 1-minute TTL (customers change, but list is read frequently)
  cache.set(cacheKey, result, CUSTOMERS_LIST_TTL);

  return result;
};

exports.getById = async (id, user = null) => {
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      tier: true,
      salesRep: { select: { id: true, name: true, email: true } },
    },
  });
  if (!customer) throw new AppError('Customer not found', 404);

  // Authorization check for customer
  if (user && user.role === 'CUSTOMER') {
    const custId = user.customerId || user.customer_id;
    const isOwnCustomer = (custId && customer.id === custId) ||
      (customer.email && customer.email.toLowerCase() === user.email.toLowerCase()) ||
      customer.ownerId === user.id;
    if (!isOwnCustomer) throw new AppError('Access denied', 403);
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

  // Invalidate customers list cache
  try {
    cache.delete('customers:list');
  } catch (e) {
    // Cache deletion failure should not break the operation
  }

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
    const custId = user.customerId || user.customer_id;
    const isOwnCustomer = (custId && existing.id === custId) || 
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

  // Invalidate customers list cache
  try {
    cache.delete('customers:list');
  } catch (e) {
    // Cache deletion failure should not break the operation
  }

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
