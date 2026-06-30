import Redis from "ioredis";
import { env } from "../config/env.js";
import { logger } from "../core/logger.js";

let client: Redis | null = null;

export function getRedis(): Redis {
  if (!client) {
    client = new Redis({
      host: env.REDIS_HOST,
      port: env.REDIS_PORT,
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        if (times > 3) return null;
        return Math.min(times * 200, 2000);
      },
      lazyConnect: true,
    });
    client.on("error", (err) => logger.warn({ err }, "Redis connection error"));
  }
  return client;
}

export async function connectRedis(): Promise<void> {
  try {
    await getRedis().connect();
    logger.info("Connected to Redis");
  } catch {
    logger.warn("Redis unavailable — caching disabled");
  }
}

export async function getCached<T>(key: string): Promise<T | null> {
  try {
    const raw = await getRedis().get(key);
    return raw ? JSON.parse(raw) as T : null;
  } catch {
    return null;
  }
}

export async function setCache(key: string, data: unknown, ttlSeconds: number): Promise<void> {
  try {
    await getRedis().setex(key, ttlSeconds, JSON.stringify(data));
  } catch {
    // cache miss is non-fatal
  }
}

export async function invalidateCache(key: string): Promise<void> {
  try {
    await getRedis().del(key);
  } catch {
    // non-fatal
  }
}

export const ioRedis = getRedis();
