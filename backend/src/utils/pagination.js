'use strict';

/**
 * Parses and validates pagination parameters from request query
 * @param {Object} query - Express req.query
 * @param {Object} [options]
 * @param {number} [options.defaultLimit=10]
 * @param {number} [options.maxLimit=100]
 * @returns {{ page: number, limit: number, skip: number, take: number }}
 */
function parsePagination(query = {}, options = {}) {
  const defaultLimit = options.defaultLimit || 10;
  const maxLimit = options.maxLimit || 100;

  if (query.all === 'true' || query.all === true || query.limit === 'all') {
    return { page: 1, limit: 100000, skip: undefined, take: undefined };
  }

  let page = parseInt(query.page, 10);
  if (isNaN(page) || page < 1) {
    page = 1;
  }

  let limit = parseInt(query.limit, 10);
  if (isNaN(limit) || limit < 1) {
    limit = defaultLimit;
  } else if (limit > maxLimit) {
    limit = maxLimit;
  }

  const skip = (page - 1) * limit;
  const take = limit;

  return { page, limit, skip, take };
}

/**
 * Builds standard pagination metadata object and decorates array for backward compatibility
 * @param {Array} items
 * @param {number} total
 * @param {number} page
 * @param {number} limit
 * @returns {Array} items decorated with pagination metadata properties
 */
function paginateResult(items, total, page, limit) {
  const totalPages = Math.ceil(total / limit) || (total === 0 ? 0 : 1);
  const pagination = {
    total,
    page,
    limit,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };

  // Attach metadata directly to the array so callers expecting an Array
  // get an Array, while callers expecting pagination metadata can read it.
  Object.defineProperties(items, {
    pagination: { value: pagination, enumerable: true, writable: true, configurable: true },
    total: { value: total, enumerable: true, writable: true, configurable: true },
    page: { value: page, enumerable: true, writable: true, configurable: true },
    limit: { value: limit, enumerable: true, writable: true, configurable: true },
    totalPages: { value: totalPages, enumerable: true, writable: true, configurable: true },
    hasNextPage: { value: pagination.hasNextPage, enumerable: true, writable: true, configurable: true },
    hasPreviousPage: { value: pagination.hasPreviousPage, enumerable: true, writable: true, configurable: true },
  });

  return items;
}

module.exports = {
  parsePagination,
  paginateResult,
};
