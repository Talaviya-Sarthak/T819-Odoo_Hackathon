'use strict';

const { AppError } = require('../../utils/errors');
const { logAudit } = require('../../services/audit.service');
const { generateKey, cache } = require('../../cache');
const prisma = require('../../database/prisma');

const CUSTOMERS_LIST_TTL = 60; // 1 minute

exports.list = async ({ user, tierId, search, myCustomers, limit = 500, offset = 0 } = {}) => {
  const where = {};
  if (tierId) where.tierId = tierId;

  // Role-based customer visibility
  if (user && user.role === 'CUSTOMER') {
    const custId = user.customerId || user.customer_id;
    where.OR = [
      ...(custId ? [{ id: custId }] : []),
      ...(user.email ? [{ email: { equals: user.email, mode: 'insensitive' } }] : []),
      { ownerId: user.id },
    ];
  } else if (user && user.role === 'SALES_REP' && (myCustomers === 'true' || myCustomers === true)) {
    where.OR = [
      { salesRepId: user.id },
      { salesRepId: null },
      { ownerId: user.id },
    ];
  }

  if (search) {
    const searchFilter = [
      { name: { contains: search, mode: 'insensitive' } },
      { company: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ];
    if (where.OR) {
      where.AND = [{ OR: where.OR }, { OR: searchFilter }];
      delete where.OR;
    } else {
      where.OR = searchFilter;
    }
  }

  const cacheKey = generateKey(
    'customers:list',
    user?.id,
    user?.role,
    tierId,
    search,
    myCustomers,
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
    take: Number(limit) || 500,
    skip: Number(offset) || 0,
  });

  // Store in cache with 1-minute TTL
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

  // Authorization checks
  if (user && user.role === 'CUSTOMER') {
    const custId = user.customerId || user.customer_id;
    const isOwnCustomer = customer.id === custId || 
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

  let tierId = data.tierId;
  if (!tierId && data.tier) {
    const foundTier = await prisma.customerTier.findFirst({
      where: { name: { equals: String(data.tier), mode: 'insensitive' } },
    });
    if (foundTier) tierId = foundTier.id;
  }
  if (!tierId) {
    const defaultTier = await prisma.customerTier.findFirst({
      orderBy: { discountPct: 'asc' },
    });
    tierId = defaultTier?.id || null;
  }

  const customer = await prisma.customer.create({
    data: {
      name: data.name,
      company: data.company || null,
      email: data.email || null,
      phone: data.phone || null,
      address: data.address || null,
      currency: data.currency || 'USD',
      tierId: tierId || null,
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
    cache.clear();
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
    const isOwnCustomer = existing.id === custId || 
      (existing.email && existing.email.toLowerCase() === user.email.toLowerCase()) ||
      existing.ownerId === user.id;
    if (!isOwnCustomer) throw new AppError('Access denied', 403);

    // Customers cannot modify their own tier or assigned sales rep
    delete data.tierId;
    delete data.salesRepId;
    delete data.ownerId;
  }

  const updateData = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.company !== undefined) updateData.company = data.company;
  if (data.email !== undefined) updateData.email = data.email;
  if (data.phone !== undefined) updateData.phone = data.phone;
  if (data.address !== undefined) updateData.address = data.address;
  if (data.currency !== undefined) updateData.currency = data.currency;
  if (data.tierId !== undefined) updateData.tierId = data.tierId;
  else if (data.tier) {
    const foundTier = await prisma.customerTier.findFirst({
      where: { name: { equals: String(data.tier), mode: 'insensitive' } },
    });
    if (foundTier) updateData.tierId = foundTier.id;
  }
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
    cache.clear();
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
