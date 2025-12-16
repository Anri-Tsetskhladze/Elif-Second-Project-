import Redis from "ioredis";

// Redis client setup
let redis = null;

const initRedis = () => {
  if (redis) return redis;

  const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

  try {
    redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryDelayOnFailover: 100,
      enableReadyCheck: true,
      lazyConnect: true,
    });

    redis.on("connect", () => {
      console.log("Redis connected");
    });

    redis.on("error", (err) => {
      console.error("Redis error:", err.message);
    });

    redis.connect().catch(() => {
      console.log("Redis not available, using in-memory cache fallback");
      redis = null;
    });
  } catch (error) {
    console.log("Redis initialization failed, using in-memory cache");
    redis = null;
  }

  return redis;
};

// In-memory cache fallback
const memoryCache = new Map();
const memoryCacheExpiry = new Map();

// Cache TTL constants (in seconds)
export const CACHE_TTL = {
  UNIVERSITY: 3600, // 1 hour
  UNIVERSITY_LIST: 1800, // 30 minutes
  POPULAR_POSTS: 300, // 5 minutes
  SEARCH_RESULTS: 60, // 1 minute
  USER_PROFILE: 600, // 10 minutes
  CATEGORIES: 3600, // 1 hour
  STATS: 300, // 5 minutes
};

// Cache key generators
export const CACHE_KEYS = {
  university: (id) => `university:${id}`,
  universityList: (page, limit, filters) => `universities:${page}:${limit}:${JSON.stringify(filters)}`,
  popularPosts: (category, page) => `popular_posts:${category || "all"}:${page}`,
  searchResults: (query, type) => `search:${type}:${query}`,
  userProfile: (userId) => `user:${userId}`,
  categories: () => "categories:all",
  universityStats: (id) => `university_stats:${id}`,
};

// Get from cache
export const getCache = async (key) => {
  try {
    if (redis) {
      const data = await redis.get(key);
      return data ? JSON.parse(data) : null;
    }

    // In-memory fallback
    const expiry = memoryCacheExpiry.get(key);
    if (expiry && Date.now() > expiry) {
      memoryCache.delete(key);
      memoryCacheExpiry.delete(key);
      return null;
    }
    return memoryCache.get(key) || null;
  } catch (error) {
    console.error("Cache get error:", error.message);
    return null;
  }
};

// Set cache
export const setCache = async (key, data, ttl = 300) => {
  try {
    if (redis) {
      await redis.setex(key, ttl, JSON.stringify(data));
    } else {
      // In-memory fallback
      memoryCache.set(key, data);
      memoryCacheExpiry.set(key, Date.now() + ttl * 1000);
    }
  } catch (error) {
    console.error("Cache set error:", error.message);
  }
};

// Delete from cache
export const deleteCache = async (key) => {
  try {
    if (redis) {
      await redis.del(key);
    } else {
      memoryCache.delete(key);
      memoryCacheExpiry.delete(key);
    }
  } catch (error) {
    console.error("Cache delete error:", error.message);
  }
};

// Delete by pattern
export const deleteCachePattern = async (pattern) => {
  try {
    if (redis) {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } else {
      // In-memory fallback
      for (const key of memoryCache.keys()) {
        if (key.includes(pattern.replace("*", ""))) {
          memoryCache.delete(key);
          memoryCacheExpiry.delete(key);
        }
      }
    }
  } catch (error) {
    console.error("Cache delete pattern error:", error.message);
  }
};

// Cache wrapper for functions
export const withCache = (keyFn, ttl) => {
  return (fn) => {
    return async (...args) => {
      const key = typeof keyFn === "function" ? keyFn(...args) : keyFn;

      const cached = await getCache(key);
      if (cached) {
        return cached;
      }

      const result = await fn(...args);
      await setCache(key, result, ttl);
      return result;
    };
  };
};

// Invalidate cache for entity
export const invalidateEntityCache = async (entity, id) => {
  const patterns = {
    university: [`university:${id}`, `universities:*`, `university_stats:${id}`],
    post: [`popular_posts:*`],
    user: [`user:${id}`],
  };

  const keys = patterns[entity] || [];
  for (const key of keys) {
    if (key.includes("*")) {
      await deleteCachePattern(key);
    } else {
      await deleteCache(key);
    }
  }
};

// Initialize Redis on import
initRedis();

export default {
  getCache,
  setCache,
  deleteCache,
  deleteCachePattern,
  withCache,
  invalidateEntityCache,
  CACHE_TTL,
  CACHE_KEYS,
};
