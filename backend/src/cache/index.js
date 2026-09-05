'use strict';

const MAX_CACHE_ENTRIES = 500;
const CLEANUP_INTERVAL_MS = 60 * 1000 * 30; // 30 minutes
const expiredTimers = new Map();

let cleanupIntervalId = null;

function isExpired(entry) {
  return entry && entry.expiresAt !== undefined && Date.now() > entry.expiresAt;
}

function normalizeKey(...parts) {
  return parts.filter((p) => p != null && p !== '').join('::');
}

function generateKey(prefix, ...params) {
  const normalized = params.map((p) => {
    if (p === undefined || p === null) return '';
    if (typeof p === 'object') return JSON.stringify(p);
    return String(p);
  });
  return normalizeKey(prefix, ...normalized);
}

class MemoryCache {
  constructor() {
    this.cache = new Map();
    this.entryCount = 0;
    this.hits = 0;
    this.misses = 0;
    this.sets = 0;
    this.invalidations = 0;
    this._initialized = false;
  }

  get(key) {
    const entry = this.cache.get(key);
    if (!entry) {
      this.misses++;
      return null;
    }

    if (isExpired(entry)) {
      this.cache.delete(key);
      this.entryCount--;
      this.misses++;
      return null;
    }

    this.hits++;
    return entry.value;
  }

  set(key, value, ttlSeconds) {
    if (this.entryCount >= MAX_CACHE_ENTRIES) {
      this._evictOldest();
    }

    const expiresAt = ttlSeconds !== undefined && ttlSeconds > 0
      ? Date.now() + ttlSeconds * 1000
      : undefined;

    const entry = { value, expiresAt };
    this.cache.set(key, entry);
    this.entryCount++;
    this.sets++;

    return this;
  }

  has(key) {
    const entry = this.cache.get(key);
    if (!entry) return false;
    if (isExpired(entry)) {
      this.cache.delete(key);
      this.entryCount--;
      return false;
    }
    return true;
  }

  delete(key) {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.entryCount--;
      this.invalidations++;
    }
    return deleted;
  }

  clear() {
    this.cache.clear();
    this.entryCount = 0;
  }

  getStats() {
    const total = this.hits + this.misses;
    return {
      hits: this.hits,
      misses: this.misses,
      sets: this.sets,
      invalidations: this.invalidations,
      totalEntries: this.entryCount,
      hitRate: total > 0 ? (this.hits / total * 100).toFixed(2) : 0,
    };
  }

  startPeriodicCleanup() {
    if (this._initialized) return;
    this._initialized = true;

    if (cleanupIntervalId) clearInterval(cleanupIntervalId);

    cleanupIntervalId = setInterval(() => {
      const now = Date.now();
      let removed = 0;

      for (const [key, entry] of this.cache) {
        if (entry.expiresAt && now > entry.expiresAt) {
          this.cache.delete(key);
          removed++;
        }
      }

      if (removed > 0) this.entryCount -= removed;
    }, CLEANUP_INTERVAL_MS);

    return this;
  }

  stopPeriodicCleanup() {
    if (cleanupIntervalId) {
      clearInterval(cleanupIntervalId);
      cleanupIntervalId = null;
    }
    this._initialized = false;
  }

  _evictOldest() {
    let oldestKey = null;
    let oldestTime = Infinity;

    for (const [key, entry] of this.cache) {
      if (entry.expiresAt !== undefined && entry.expiresAt < oldestTime) {
        oldestTime = entry.expiresAt;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.entryCount--;
    } else {
      const firstKey = this.cache.keys().next().value;
      if (firstKey != null) {
        this.cache.delete(firstKey);
        this.entryCount--;
      }
    }
  }
}

const cache = new MemoryCache();
cache.startPeriodicCleanup();

module.exports = {
  cache,
  generateKey,
  normalizeKey,
  MAX_CACHE_ENTRIES,
  CLEANUP_INTERVAL_MS,
  get: (key) => cache.get(key),
  set: (key, value, ttlSeconds) => cache.set(key, value, ttlSeconds),
  has: (key) => cache.has(key),
  delete: (key) => cache.delete(key),
  clear: () => cache.clear(),
  getStats: () => cache.getStats(),
  MAX_CACHE_ENTRIES,
};