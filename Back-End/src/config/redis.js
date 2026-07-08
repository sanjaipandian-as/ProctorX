const { Redis } = require('@upstash/redis');
const env = require('./env');

let redis = null;
let isRedisAvailable = false;

if (env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN && !env.UPSTASH_REDIS_REST_URL.includes('dummy')) {
  try {
    redis = new Redis({
      url: env.UPSTASH_REDIS_REST_URL,
      token: env.UPSTASH_REDIS_REST_TOKEN
    });
    isRedisAvailable = true;
    console.log('Upstash Redis Client initialized');
  } catch (error) {
    console.error('Failed to initialize Upstash Redis Client, using memory fallback:', error.message);
  }
} else {
  console.log('Upstash Redis credentials not provided. Using in-memory fallback cache.');
}

// In-Memory cache fallback implementation
const memoryCache = new Map();

const memoryFallback = {
  get: async (key) => {
    const item = memoryCache.get(key);
    if (!item) return null;
    if (item.expiresAt && Date.now() > item.expiresAt) {
      memoryCache.delete(key);
      return null;
    }
    return typeof item.value === 'string' ? item.value : JSON.stringify(item.value);
  },
  set: async (key, value) => {
    memoryCache.set(key, { value, expiresAt: null });
    return 'OK';
  },
  setex: async (key, seconds, value) => {
    const expiresAt = Date.now() + seconds * 1000;
    memoryCache.set(key, { value, expiresAt });
    return 'OK';
  },
  del: async (key) => {
    memoryCache.delete(key);
    return 1;
  }
};

const activeClient = isRedisAvailable ? redis : memoryFallback;

async function withCache(key, ttl, fetchFn) {
  try {
    const cached = await activeClient.get(key);
    if (cached) {
      return typeof cached === 'string' ? JSON.parse(cached) : cached;
    }
  } catch (err) {
    console.error(`Cache read error on key ${key}:`, err.message);
  }

  const data = await fetchFn();

  try {
    if (data !== undefined && data !== null) {
      await activeClient.setex(key, ttl, JSON.stringify(data));
    }
  } catch (err) {
    console.error(`Cache write error on key ${key}:`, err.message);
  }

  return data;
}

module.exports = {
  redis: activeClient,
  withCache,
  isRedisAvailable
};
