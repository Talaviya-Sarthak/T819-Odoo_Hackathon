'use strict';

const { PrismaClient } = require('@prisma/client');
const { AppError } = require('../../utils/errors');

const prisma = new PrismaClient();

exports.list = async ({ tierId }) => {
  const where = {};
  if (tierId) where.tierId = tierId;

  return prisma.customer.findMany({
    where,
    include: { tier: true },
    orderBy: { createdAt: 'desc' },
  });
};

exports.getById = async (id) => {
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: { tier: true },
  });
  if (!customer) throw new AppError('Customer not found', 404);
  return customer;
};

exports.create = async (data) => {
  return prisma.customer.create({ data, include: { tier: true } });
};

exports.update = async (id, data) => {
  const existing = await prisma.customer.findUnique({ where: { id } });
  if (!existing) throw new AppError('Customer not found', 404);
  return prisma.customer.update({ where: { id }, data, include: { tier: true } });
};
