import fs from "fs";
import path from "path";

interface CacheItem<T = any> {
  value: T;
  expiresAt: number; // timestamp in ms, 0 = no expiry
  updatedAt: number;
}

const CACHE_DIR = path.join(process.cwd(), ".cache");
const CACHE_FILE = path.join(CACHE_DIR, "lirics_persistent_cache.json");

// In-Memory L1 Cache Map
const memoryStore = new Map<string, CacheItem>();
let isInitialized = false;
let saveDebounceTimer: NodeJS.Timeout | null = null;

// Optional Redis L3 Cache Client
let redisClient: any = null;
let redisAvailable = false;

function initRedisIfConfigured() {
  const redisUrl = process.env.REDIS_URL;
  const redisHost = process.env.REDIS_HOST;

  if (redisUrl || redisHost) {
    try {
      // Dynamically require ioredis if installed
      let RedisModule: any = null;
      try {
        // eslint-disable-next-line
        RedisModule = require("ioredis");
      } catch {
        console.info("[PersistentCache] 'ioredis' package not installed. Operating with 100% disk persistent cache.");
        return;
      }

      if (!RedisModule) return;
      const RedisClass = RedisModule.default || RedisModule;

      redisClient = redisUrl
        ? new RedisClass(redisUrl, {
            connectTimeout: 2000,
            maxRetriesPerRequest: 1,
            enableOfflineQueue: false,
            lazyConnect: true,
          })
        : new RedisClass({
            host: redisHost,
            port: parseInt(process.env.REDIS_PORT || "6379", 10),
            password: process.env.REDIS_PASSWORD || undefined,
            connectTimeout: 2000,
            maxRetriesPerRequest: 1,
            enableOfflineQueue: false,
            lazyConnect: true,
          });

      redisClient.on("connect", () => {
        redisAvailable = true;
        console.log("[PersistentCache] Connected to Redis cache instance.");
      });

      redisClient.on("error", (err: any) => {
        if (redisAvailable) {
          console.warn("[PersistentCache] Redis disconnected, falling back to disk cache.");
        }
        redisAvailable = false;
      });

      redisClient.connect().catch(() => {
        redisAvailable = false;
      });
    } catch (e) {
      redisAvailable = false;
    }
  }
}

/**
 * Initializes disk persistence by loading cached entries from .cache/lirics_persistent_cache.json
 */
function initDiskCache() {
  if (typeof window !== "undefined" || isInitialized) return;
  isInitialized = true;

  try {
    if (!fs.existsSync(CACHE_DIR)) {
      fs.mkdirSync(CACHE_DIR, { recursive: true });
    }

    if (fs.existsSync(CACHE_FILE)) {
      const fileData = fs.readFileSync(CACHE_FILE, "utf-8");
      if (fileData.trim()) {
        const parsed = JSON.parse(fileData);
        const now = Date.now();
        let loadedCount = 0;

        const keys = Object.keys(parsed);
        for (let i = 0; i < keys.length; i++) {
          const k = keys[i];
          const entry = parsed[k] as CacheItem;
          // Filter out expired items
          if (!entry.expiresAt || entry.expiresAt > now) {
            memoryStore.set(k, entry);
            loadedCount++;
          }
        }
        console.log(`[PersistentCache] Loaded ${loadedCount} entries from persistent disk cache.`);
      }
    }
  } catch (err) {
    console.warn("[PersistentCache] Warning while loading disk cache:", err);
  }

  initRedisIfConfigured();
}

/**
 * Debounced atomic flush to disk
 */
function scheduleDiskFlush() {
  if (typeof window !== "undefined") return;
  if (saveDebounceTimer) {
    clearTimeout(saveDebounceTimer);
  }

  saveDebounceTimer = setTimeout(() => {
    saveDebounceTimer = null;
    flushToDiskSync();
  }, 600);
}

function flushToDiskSync() {
  try {
    if (!fs.existsSync(CACHE_DIR)) {
      fs.mkdirSync(CACHE_DIR, { recursive: true });
    }

    const exportObj: Record<string, CacheItem> = {};
    const now = Date.now();

    memoryStore.forEach((item, key) => {
      if (!item.expiresAt || item.expiresAt > now) {
        exportObj[key] = item;
      } else {
        memoryStore.delete(key);
      }
    });

    const tempFile = `${CACHE_FILE}.tmp.${Date.now()}`;
    fs.writeFileSync(tempFile, JSON.stringify(exportObj, null, 2), "utf-8");
    fs.renameSync(tempFile, CACHE_FILE);
  } catch (err) {
    console.warn("[PersistentCache] Failed to flush cache to disk:", err);
  }
}

/**
 * Normalizes cache keys across track names, artist names, or IDs
 */
export function normalizeCacheKey(namespace: string, key: string): string {
  const cleanKey = key
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "_")
    .trim();
  return `${namespace}:${cleanKey}`;
}

/**
 * Retrieve cached item. Checks L1 Memory -> L3 Redis -> L2 Disk.
 */
export async function getPersistentCache<T>(
  namespace: string,
  key: string
): Promise<T | null> {
  initDiskCache();

  const fullKey = normalizeCacheKey(namespace, key);
  const now = Date.now();

  // 1. Check L1 Memory (0ms)
  const memItem = memoryStore.get(fullKey);
  if (memItem) {
    if (memItem.expiresAt && memItem.expiresAt <= now) {
      memoryStore.delete(fullKey);
      scheduleDiskFlush();
    } else {
      return memItem.value as T;
    }
  }

  // 2. Check L3 Redis if active
  if (redisAvailable && redisClient) {
    try {
      const redisVal = await redisClient.get(fullKey);
      if (redisVal) {
        const parsed = JSON.parse(redisVal);
        // Save back into L1 memory
        memoryStore.set(fullKey, {
          value: parsed,
          expiresAt: now + 3600000,
          updatedAt: now,
        });
        return parsed as T;
      }
    } catch {
      // Redis error fallback
    }
  }

  return null;
}

/**
 * Store an item in persistent cache. Writes to L1 Memory, L2 Disk, and L3 Redis.
 * 
 * Default TTLs:
 * - Lyrics: 14 days
 * - Artwork: 30 days
 * - Track Meta: 7 days
 */
export async function setPersistentCache<T>(
  namespace: string,
  key: string,
  value: T,
  ttlMs?: number
): Promise<void> {
  initDiskCache();

  const fullKey = normalizeCacheKey(namespace, key);
  const now = Date.now();

  // Default TTL heuristics if not specified
  let effectiveTtl = ttlMs;
  if (effectiveTtl === undefined) {
    if (namespace === "lyrics") effectiveTtl = 14 * 86400 * 1000; // 14 days
    else if (namespace === "artwork") effectiveTtl = 30 * 86400 * 1000; // 30 days
    else if (namespace === "track_meta") effectiveTtl = 7 * 86400 * 1000; // 7 days
    else effectiveTtl = 7 * 86400 * 1000;
  }

  const expiresAt = effectiveTtl > 0 ? now + effectiveTtl : 0;

  const item: CacheItem<T> = {
    value,
    expiresAt,
    updatedAt: now,
  };

  // 1. Save in L1 Memory
  memoryStore.set(fullKey, item);

  // 2. Schedule debounced flush to L2 Disk
  scheduleDiskFlush();

  // 3. Save to L3 Redis if connected
  if (redisAvailable && redisClient) {
    try {
      const serialized = JSON.stringify(value);
      if (effectiveTtl > 0) {
        await redisClient.set(fullKey, serialized, "PX", effectiveTtl);
      } else {
        await redisClient.set(fullKey, serialized);
      }
    } catch {
      // Redis write error ignored
    }
  }
}

/**
 * Remove an item or entire namespace from cache
 */
export async function deletePersistentCache(namespace: string, key?: string): Promise<void> {
  initDiskCache();

  if (key) {
    const fullKey = normalizeCacheKey(namespace, key);
    memoryStore.delete(fullKey);
    if (redisAvailable && redisClient) {
      try {
        await redisClient.del(fullKey);
      } catch {}
    }
  } else {
    // Delete all keys matching namespace
    const prefix = `${namespace}:`;
    memoryStore.forEach((_, k) => {
      if (k.startsWith(prefix)) {
        memoryStore.delete(k);
      }
    });
    if (redisAvailable && redisClient) {
      try {
        const keys = await redisClient.keys(`${prefix}*`);
        if (keys.length > 0) {
          await redisClient.del(...keys);
        }
      } catch {}
    }
  }

  scheduleDiskFlush();
}

/**
 * Returns cache statistics for diagnostics
 */
export function getPersistentCacheStats() {
  initDiskCache();

  let diskSizeBytes = 0;
  try {
    if (fs.existsSync(CACHE_FILE)) {
      diskSizeBytes = fs.statSync(CACHE_FILE).size;
    }
  } catch {}

  return {
    memoryEntries: memoryStore.size,
    diskSizeBytes,
    diskPath: CACHE_FILE,
    redisConnected: redisAvailable,
  };
}
