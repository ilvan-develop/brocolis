import { createRequire } from "node:module";
import { Injectable } from "@nestjs/common";
import type { ThrottlerStorage } from "@nestjs/throttler";

const req = createRequire(import.meta.url);

type RedisInstance = {
  exists(key: string): Promise<number>;
  pttl(key: string): Promise<number>;
  get(key: string): Promise<string | null>;
  incr(key: string): Promise<number>;
  pexpire(key: string, ms: number): Promise<number>;
  setex(key: string, seconds: number, value: string): Promise<string>;
  quit(): Promise<"OK">;
};

@Injectable()
export class RedisThrottlerStorage implements ThrottlerStorage {
  private readonly redis: RedisInstance;

  constructor(redisUrl: string) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
    this.redis = new (
      req("ioredis") as new (
        url: string,
        opts?: Record<string, unknown>,
      ) => RedisInstance
    )(redisUrl, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: true,
    });
  }

  async increment(
    key: string,
    ttl: number,
    limit: number,
    blockDuration: number,
    throttlerName: string,
  ): Promise<{
    totalHits: number;
    timeToExpire: number;
    isBlocked: boolean;
    timeToBlockExpire: number;
  }> {
    const storageKey = `throttle:${key}:${throttlerName}`;
    const blockKey = `throttle:block:${key}:${throttlerName}`;

    const isBlocked = await this.redis.exists(blockKey);

    if (isBlocked) {
      const blockTtl = await this.redis.pttl(blockKey);
      const hits = (await this.redis.get(storageKey)) ?? "0";
      return {
        totalHits: Number(hits),
        timeToExpire: Math.ceil(Math.max(blockTtl, 0) / 1000),
        isBlocked: true,
        timeToBlockExpire: Math.ceil(Math.max(blockTtl, 0) / 1000),
      };
    }

    const totalHits = await this.redis.incr(storageKey);

    if (totalHits === 1) {
      await this.redis.pexpire(storageKey, ttl);
    }

    const timeToExpire = await this.redis.pttl(storageKey);

    if (totalHits > limit && blockDuration > 0) {
      await this.redis.setex(blockKey, Math.ceil(blockDuration / 1000), "1");
      return {
        totalHits,
        timeToExpire: Math.ceil(Math.max(timeToExpire, 0) / 1000),
        isBlocked: true,
        timeToBlockExpire: Math.ceil(blockDuration / 1000),
      };
    }

    return {
      totalHits,
      timeToExpire: Math.ceil(Math.max(timeToExpire, 0) / 1000),
      isBlocked: false,
      timeToBlockExpire: 0,
    };
  }

  async disconnect(): Promise<void> {
    await this.redis.quit();
  }
}
