/**
 * Intelligent Client Query Cache & In-Flight Deduplication
 * 
 * Provides stale-while-revalidate and memory caching with auto-invalidation,
 * in-flight promise deduplication, and prefetching capabilities.
 */

export interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  staleTime: number;
  expiresAt: number;
}

export interface QueryCacheOptions {
  staleTime?: number; // ms during which cached data is fresh (default 60s)
  cacheTime?: number; // ms to retain data in memory (default 5min)
  forceRefresh?: boolean; // bypass cache and force network fetch
  signal?: AbortSignal;
}

class QueryCache {
  private cache = new Map<string, CacheEntry<any>>();
  private inFlight = new Map<string, Promise<any>>();
  private abortControllers = new Map<string, AbortController>();

  // Default configuration
  private defaultStaleTime = 60 * 1000; // 60 seconds
  private defaultCacheTime = 5 * 60 * 1000; // 5 minutes

  /**
   * Check if a valid, non-expired cache entry exists
   */
  public has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }
    return true;
  }

  /**
   * Check if the cache entry is fresh (not stale)
   */
  public isFresh(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    const now = Date.now();
    return now <= entry.timestamp + entry.staleTime && now <= entry.expiresAt;
  }

  /**
   * Get cached data synchronously
   */
  public get<T = any>(key: string): T | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return undefined;
    }
    return entry.data as T;
  }

  /**
   * Store data in cache
   */
  public set<T = any>(
    key: string,
    data: T,
    options?: { staleTime?: number; cacheTime?: number }
  ): void {
    const now = Date.now();
    const staleTime = options?.staleTime ?? this.defaultStaleTime;
    const cacheTime = options?.cacheTime ?? this.defaultCacheTime;

    this.cache.set(key, {
      data,
      timestamp: now,
      staleTime,
      expiresAt: now + cacheTime,
    });
  }

  /**
   * Execute or reuse a query with caching and in-flight deduplication
   */
  public async fetch<T>(
    key: string,
    fetcher: (signal?: AbortSignal) => Promise<T>,
    options?: QueryCacheOptions
  ): Promise<T> {
    const forceRefresh = options?.forceRefresh ?? false;
    const staleTime = options?.staleTime ?? this.defaultStaleTime;
    const cacheTime = options?.cacheTime ?? this.defaultCacheTime;

    // 1. If fresh and not forcing refresh, return cached data immediately (0ms)
    if (!forceRefresh && this.isFresh(key)) {
      return this.get<T>(key)!;
    }

    // 2. If already in flight, reuse existing promise (deduplication)
    if (this.inFlight.has(key)) {
      return this.inFlight.get(key) as Promise<T>;
    }

    // 3. Setup abort controller for prefetch / cancellation
    const controller = new AbortController();
    this.abortControllers.set(key, controller);

    if (options?.signal) {
      options.signal.addEventListener('abort', () => controller.abort());
    }

    const promise = (async () => {
      try {
        const data = await fetcher(controller.signal);
        this.set(key, data, { staleTime, cacheTime });
        return data;
      } finally {
        this.inFlight.delete(key);
        this.abortControllers.delete(key);
      }
    })();

    this.inFlight.set(key, promise);
    return promise;
  }

  /**
   * Prefetch data into the cache if not fresh or already in flight
   */
  public async prefetch<T>(
    key: string,
    fetcher: (signal?: AbortSignal) => Promise<T>,
    options?: QueryCacheOptions
  ): Promise<void> {
    // If already fresh or in-flight, do nothing to prevent unnecessary network traffic
    if (this.isFresh(key) || this.inFlight.has(key)) {
      return;
    }

    try {
      await this.fetch(key, fetcher, options);
    } catch {
      // Background prefetch errors are silently ignored to prevent unhandled rejections
    }
  }

  /**
   * Cancel an in-flight request
   */
  public cancel(key: string): void {
    const controller = this.abortControllers.get(key);
    if (controller) {
      controller.abort();
      this.abortControllers.delete(key);
      this.inFlight.delete(key);
    }
  }

  /**
   * Cancel all pending in-flight requests (e.g. on navigation)
   */
  public cancelAllPrefetches(): void {
    this.abortControllers.forEach((controller) => {
      controller.abort();
    });
    this.abortControllers.clear();
    this.inFlight.clear();
  }

  /**
   * Invalidate cache entries matching a string or RegExp pattern
   */
  public invalidate(pattern?: string | RegExp | string[]): void {
    if (!pattern) {
      this.cache.clear();
      return;
    }

    const patterns = Array.isArray(pattern) ? pattern : [pattern];

    for (const key of this.cache.keys()) {
      const shouldDelete = patterns.some((p) => {
        if (typeof p === 'string') {
          return key.includes(p);
        }
        return p.test(key);
      });

      if (shouldDelete) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear entire cache and abort all pending controllers (used on logout)
   */
  public clear(): void {
    this.cancelAllPrefetches();
    this.cache.clear();
  }
}

export const queryCache = new QueryCache();
