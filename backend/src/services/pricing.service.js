'use strict';

const { Prisma } = require('@prisma/client');
const { generateKey, cache } = require('../cache');
const prisma = require('../database/prisma');

/**
 * Product price cache with TTL support.
 * Key format: product:<productId>:customer:<customerId>
 * Or: product:<productId> for base price (no customer context)
 */

const PRODUCT_PRICE_TTL = 5 * 60; // 5 minutes

// In-memory cache for product prices (keyed by productId:customerId)
const productPriceCache = new Map();

/**
 * Resolves the effective product price for a given customer.
 * Resolution hierarchy:
 * 1. Customer-specific price list item (if any)
 * 2. Customer-tier price list item (if any)
 * 3. Base product price
 *
 * @param {string} productId
 * @param {string} customerId
 * @returns {Promise<{ price: import('@prisma/client').Decimal, costPrice: import('@prisma/client').Decimal, taxRate: import('@prisma/client').Decimal, source: string, currency: string }>}
 */
async function getEffectiveProductPrice(productId, customerId) {
  // Check cache first
  const cacheKey = generateKey('product:price', productId, customerId || 'none');
  const cached = productPriceCache.get(cacheKey);
  if (cached && !isExpiredCacheEntry(cached)) {
    return cached.value;
  }

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
  let result;
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
      result = {
        price: tierPriceListItem.price,
        costPrice: product.costPrice,
        taxRate: product.taxRate,
        source: `TIER_PRICE_LIST (${tierPriceListItem.priceList.name})`,
        currency: tierPriceListItem.priceList.currency || customer.currency || 'USD',
      };

      // Store in cache
      productPriceCache.set(cacheKey, { value: result, expiresAt: Date.now() + PRODUCT_PRICE_TTL * 1000 });
      return result;
    }
  }

  // 2. Default to Base Price
  result = {
    price: product.basePrice,
    costPrice: product.costPrice,
    taxRate: product.taxRate,
    source: 'BASE_PRICE',
    currency: customer ? customer.currency : 'USD',
  };

  // Store in cache
  productPriceCache.set(cacheKey, { value: result, expiresAt: Date.now() + PRODUCT_PRICE_TTL * 1000 });

  return result;
}

/**
 * Clears the product price cache for a specific product.
 */
function clearProductPriceCache(productId) {
  for (const key of productPriceCache.keys()) {
    if (key.startsWith(`product:${productId}:`)) {
      productPriceCache.delete(key);
    }
  }
}

/**
 * Clears all product price cache entries.
 */
function clearAllProductPriceCache() {
  productPriceCache.clear();
}

/**
 * Checks if a cache entry has expired.
 */
function isExpiredCacheEntry(entry) {
  return entry && entry.expiresAt !== undefined && Date.now() > entry.expiresAt;
}

/**
 * Batch resolves effective product prices for multiple products and customers.
 * This eliminates the N+1 query problem by fetching all needed data in a single query.
 *
 * @param {Array<{ productId: string, customerId?: string }>} requests
 * @returns {Promise<Map<string, { price: Prisma.Decimal, costPrice: Prisma.Decimal, taxRate: Prisma.Decimal, source: string, currency: string }>>}
 */
async function batchGetEffectiveProductPrice(requests) {
  if (requests.length === 0) return new Map();

  // Separate requests with and without customer context
  const withCustomer = [];
  const withoutCustomer = [];

  for (const req of requests) {
    if (req.customerId) {
      withCustomer.push(req);
    } else {
      withoutCustomer.push(req);
    }
  }

  // Build cache keys for quick lookups
  const resultMap = new Map();

  // First, check cache for all requests
  for (const req of requests) {
    const cacheKey = generateKey('product:price', req.productId, req.customerId || 'none');
    const cached = productPriceCache.get(cacheKey);
    if (cached && !isExpiredCacheEntry(cached)) {
      resultMap.set(req.productId, cached.value);
    }
  }

  // Determine which product IDs still need DB lookup
  const productsNeedingLookup = new Set();
  const productsWithoutCustomer = new Set();

  for (const req of requests) {
    const cacheKey = generateKey('product:price', req.productId, req.customerId || 'none');
    if (!productPriceCache.has(cacheKey) || isExpiredCacheEntry(productPriceCache.get(cacheKey))) {
      if (req.customerId) {
        productsNeedingLookup.add(req.productId);
      } else {
        productsWithoutCustomer.add(req.productId);
      }
    }
  }

  // Fetch products without customer context in batch
  if (productsWithoutCustomer.size > 0) {
    const products = await prisma.product.findMany({
      where: { id: { in: Array.from(productsWithoutCustomer) } },
      include: { category: true },
    });

    for (const product of products) {
      const cacheKey = generateKey('product:price', product.id, 'none');
      const result = {
        price: product.basePrice,
        costPrice: product.costPrice,
        taxRate: product.taxRate,
        source: 'BASE_PRICE',
        currency: 'USD',
      };
      productPriceCache.set(cacheKey, { value: result, expiresAt: Date.now() + PRODUCT_PRICE_TTL * 1000 });
      resultMap.set(product.id, result);
    }
  }

  // Fetch products with customer context in batch
  if (productsNeedingLookup.size > 0) {
    const customerIds = [...new Set(requests.filter(r => productsNeedingLookup.has(r.productId)).map(r => r.customerId))];
    const customers = {};

    if (customerIds.length > 0) {
      const allCustomers = await prisma.customer.findMany({
        where: { id: { in: customerIds } },
        include: { tier: true },
      });
      for (const c of allCustomers) {
        customers[c.id] = c;
      }
    }

    // Fetch all relevant price list items in batch
    const productIds = [...productsNeedingLookup];
    const priceListItems = await prisma.priceListItem.findMany({
      where: {
        productId: { in: productIds },
        priceList: {
          active: true,
        },
        include: { priceList: true },
      },
    });

    // Group price list items by productId
    const priceListByProduct = {};
    for (const item of priceListItems) {
      if (!priceListByProduct[item.productId]) {
        priceListByProduct[item.productId] = [];
      }
      priceListByProduct[item.productId].push(item);
    }

    // Process each product that needs lookup
    for (const productId of productsNeedingLookup) {
      const customerId = requests.find(r => r.productId === productId).customerId;
      const customer = customers[customerId];
      const priceListItemsForProduct = priceListByProduct[productId] || [];

      let hasTierPrice = false;

      for (const pl of priceListItemsForProduct) {
        if (customer && pl.priceList.customerTierId === customer.tierId) {
          // Check if this price list item matches the customer's tier
          hasTierPrice = true;
          const tierCustomer = customer;
          resultMap.set(productId, {
            price: pl.price,
            costPrice: product.costPrice,
            taxRate: product.taxRate,
            source: `TIER_PRICE_LIST (${pl.priceList.name})`,
            currency: pl.priceList.currency || tierCustomer.currency || 'USD',
          });
          break;
        }
      }

      if (!hasTierPrice) {
        // Fall back to base price
        resultMap.set(productId, {
          price: product.basePrice,
          costPrice: product.costPrice,
          taxRate: product.taxRate,
          source: 'BASE_PRICE',
          currency: customer ? customer.currency : 'USD',
        });
      }
    }
  }

  // Handle products that weren't in any request but were referenced
  // (this handles the case where some products were cached and some weren't)
  for (const req of requests) {
    if (!resultMap.has(req.productId)) {
      // Should not happen, but as fallback
      resultMap.set(req.productId, {
        price: new Prisma.Decimal(0),
        costPrice: new Prisma.Decimal(0),
        taxRate: new Prisma.Decimal(0),
        source: 'MISSING',
        currency: 'USD',
      });
    }
  }

  return resultMap;
}

module.exports = {
  getEffectiveProductPrice,
  batchGetEffectiveProductPrice,
  clearProductPriceCache,
  clearAllProductPriceCache,
  PRODUCT_PRICE_TTL,
};
