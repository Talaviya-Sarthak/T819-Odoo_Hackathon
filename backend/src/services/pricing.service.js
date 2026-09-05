'use strict';

const { Prisma } = require('@prisma/client');
const prisma = require('../database/prisma');

/**
 * Resolves the effective product price for a given customer.
 * Resolution hierarchy:
 * 1. Customer-specific price list item (if any)
 * 2. Customer-tier price list item (if any)
 * 3. Base product price
 *
 * @param {string} productId 
 * @param {string} customerId 
 * @returns {Promise<{ price: Prisma.Decimal, costPrice: Prisma.Decimal, taxRate: Prisma.Decimal, source: string, currency: string }>}
 */
async function getEffectiveProductPrice(productId, customerId) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { category: true },
  });

  if (!product) {
    throw new Error(`Product not found: ${productId}`);
  }

  let customer = null;
  if (customerId) {
    customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: { tier: true },
    });
  }

  // 1. Check Customer Tier price list
  if (customer && customer.tierId) {
    const tierPriceListItem = await prisma.priceListItem.findFirst({
      where: {
        productId,
        priceList: {
          customerTierId: customer.tierId,
          active: true,
        },
      },
      include: { priceList: true },
    });

    if (tierPriceListItem) {
      return {
        price: tierPriceListItem.price,
        costPrice: product.costPrice,
        taxRate: product.taxRate,
        source: `TIER_PRICE_LIST (${tierPriceListItem.priceList.name})`,
        currency: tierPriceListItem.priceList.currency || customer.currency || 'USD',
      };
    }
  }

  // 2. Default to Base Price
  return {
    price: product.basePrice,
    costPrice: product.costPrice,
    taxRate: product.taxRate,
    source: 'BASE_PRICE',
    currency: customer ? customer.currency : 'USD',
  };
}

module.exports = {
  getEffectiveProductPrice,
};
