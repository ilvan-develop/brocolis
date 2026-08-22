import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ThrottlerModule } from "@nestjs/throttler";
import { RedisThrottlerStorage } from "./throttler-storage.service.js";

@Module({
  imports: [
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const redisUrl = config.get<string>(
          "REDIS_URL",
          "redis://localhost:16379",
        );
        const ttlMs = config.get<number>("THROTTLER_TTL_MS", 60000);
        const limit = config.get<number>("THROTTLER_LIMIT", 10);

        const storage = new RedisThrottlerStorage(redisUrl);

        return {
          throttlers: [
            { name: "default", ttl: ttlMs, limit },
            { name: "auth", ttl: ttlMs, limit: 5 },
          ],
          storage,
          ignoreUserAgents: [/healthcheck/i],
        };
      },
    }),
  ],
  exports: [ThrottlerModule],
})
export class RateLimitModule {}
