/**
 * Ultra-fast in-memory cache for API responses.
 * TTL-based cache with automatic invalidation.
 * Pattern: middleware wrapper around route handlers.
 */

type CacheEntry = {
  data: unknown;
  expiry: number;
};

const store = new Map<string, CacheEntry>();

const DEFAULT_TTL = 30_000; // 30 seconds
const CLEANUP_INTERVAL = 60_000; // 1 minute

// Auto-cleanup expired entries
let cleanupTimer: ReturnType<typeof setInterval> | null = null;
function ensureCleanup() {
  if (cleanupTimer) return;
  cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
      if (entry.expiry <= now) store.delete(key);
    }
  }, CLEANUP_INTERVAL);
  // Don't keep process alive for this
  if (cleanupTimer.unref) cleanupTimer.unref();
}

export function getCached<T>(key: string): T | null {
  const entry = store.get(key);
  if (!entry) return null;
  if (entry.expiry <= Date.now()) {
    store.delete(key);
    return null;
  }
  return entry.data as T;
}

export function setCache(key: string, data: unknown, ttlMs: number = DEFAULT_TTL): void {
  ensureCleanup();
  store.set(key, { data, expiry: Date.now() + ttlMs });
}

export function invalidateCache(prefix: string): void {
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) store.delete(key);
  }
}

export function clearCache(): void {
  store.clear();
}

/**
 * Express middleware that caches GET responses in-memory.
 * Usage: app.get('/api/mixes', cacheMiddleware(30000), handler)
 */
export function cacheMiddleware(ttlMs: number = DEFAULT_TTL) {
  ensureCleanup();
  return (req: any, res: any, next: any) => {
    if (req.method !== 'GET') return next();

    const key = `${req.baseUrl}${req.path}?${JSON.stringify(req.query)}`;
    const cached = getCached(key);
    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      return res.json(cached);
    }

    // Monkey-patch res.json to intercept and cache
    const originalJson = res.json.bind(res);
    res.json = (body: any) => {
      // Only cache successful responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        setCache(key, body, ttlMs);
      }
      res.setHeader('X-Cache', 'MISS');
      return originalJson(body);
    };

    next();
  };
}

/**
 * Bust cache for a route prefix on mutations.
 * Usage: invalidateCache('/api/mixes') after POST/PUT/DELETE
 */
export { invalidateCache as bustCache };
