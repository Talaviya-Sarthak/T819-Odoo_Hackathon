import prisma from '../common/prisma';
import { NotFoundError } from '../common/errors';

export async function getAllCustomers(salesRepId?: string) {
  const where: any = {};
  if (salesRepId) where.salesRepId = salesRepId;

  return prisma.customer.findMany({
    where,
    include: { tier: true, salesRepresentative: { select: { id: true, name: true, email: true } } },
    orderBy: { name: 'asc' },
  });
}

export async function getCustomerById(id: string) {
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: { tier: true, salesRepresentative: { select: { id: true, name: true, email: true } } },
  });
  if (!customer) throw new NotFoundError('Customer not found');
  return customer;
}

export async function createCustomer(data: {
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  address?: string;
  currency?: string;
  tierId?: string;
  salesRepId?: string;
  ownerId?: string;
}) {
  return prisma.customer.create({ data });
}

export async function getAllCustomerTiers() {
  return prisma.customerTier.findMany({ orderBy: { name: 'asc' } });
}

export async function getCustomerTierById(id: string) {
  const tier = await prisma.customerTier.findUnique({ where: { id } });
  if (!tier) throw new NotFoundError('Customer tier not found');
  return tier;
}
