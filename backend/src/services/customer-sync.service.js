'use strict';

const prisma = require('../database/prisma');
const logger = require('../utils/logger');

/**
 * Ensures that all users with role 'CUSTOMER' have an associated Customer record
 * and that their customerId is set properly.
 */
async function syncCustomerAccounts() {
  try {
    const customerUsers = await prisma.user.findMany({
      where: { role: 'CUSTOMER' },
    });

    const defaultTier = await prisma.customerTier.findFirst({
      orderBy: { discountPct: 'asc' },
    });

    let createdCount = 0;
    let linkedCount = 0;

    for (const user of customerUsers) {
      let customer = null;

      if (user.customerId) {
        customer = await prisma.customer.findUnique({
          where: { id: user.customerId },
        });
      }

      if (!customer && user.email) {
        customer = await prisma.customer.findFirst({
          where: { email: { equals: user.email, mode: 'insensitive' } },
        });
      }

      if (!customer) {
        customer = await prisma.customer.findFirst({
          where: { ownerId: user.id },
        });
      }

      if (!customer) {
        customer = await prisma.customer.create({
          data: {
            name: user.name || user.email.split('@')[0],
            company: user.name ? `${user.name} Enterprise` : 'Direct Customer Account',
            email: user.email,
            currency: 'USD',
            tierId: defaultTier?.id || null,
            ownerId: user.id,
          },
        });
        createdCount++;
      }

      if (user.customerId !== customer.id) {
        await prisma.user.update({
          where: { id: user.id },
          data: { customerId: customer.id },
        });
        linkedCount++;
      }
    }

    if (createdCount > 0 || linkedCount > 0) {
      logger.info(`[CustomerSync] Created ${createdCount} customer records and linked ${linkedCount} users.`);
    }
  } catch (err) {
    logger.error({ err }, '[CustomerSync] Error during customer synchronization');
  }
}

/**
 * Ensures that a specific user has a Customer record linked.
 */
async function ensureCustomerForUser(user) {
  if (!user) return null;
  if (user.role && user.role !== 'CUSTOMER') return null;

  try {
    let customer = null;
    const custId = user.customerId || user.customer_id;
    if (custId) {
      customer = await prisma.customer.findUnique({ where: { id: custId } });
    }

    if (!customer && user.email) {
      customer = await prisma.customer.findFirst({
        where: { email: { equals: user.email, mode: 'insensitive' } },
      });
    }

    if (!customer && user.id) {
      customer = await prisma.customer.findFirst({
        where: { ownerId: user.id },
      });
    }

    if (!customer) {
      const defaultTier = await prisma.customerTier.findFirst({
        orderBy: { discountPct: 'asc' },
      });
      customer = await prisma.customer.create({
        data: {
          name: user.name || user.email.split('@')[0],
          company: user.company || (user.name ? `${user.name} Enterprise` : 'Direct Customer Account'),
          email: user.email,
          currency: 'USD',
          tierId: defaultTier?.id || null,
          ownerId: user.id || null,
        },
      });

      try {
        const { cache } = require('../cache');
        cache.clear();
      } catch (e) {}
    }

    if (user.id && (user.customerId !== customer.id && user.customer_id !== customer.id)) {
      await prisma.user.update({
        where: { id: user.id },
        data: { customerId: customer.id },
      });
      user.customerId = customer.id;
      user.customer_id = customer.id;
    }

    return customer;
  } catch (err) {
    logger.error({ err }, '[CustomerSync] Failed to ensure customer record for user');
    return null;
  }
}

module.exports = {
  syncCustomerAccounts,
  ensureCustomerForUser,
};
