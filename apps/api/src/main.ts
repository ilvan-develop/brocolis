import { createLogger } from "@brocolis/observability";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import helmet from "helmet";
import "./observability/sentry.js";
import { AppModule } from "./app.module.js";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'", "https://*.sentry.io"],
          frameAncestors: ["'none'"],
        },
      },
      hsts: { maxAge: 63072000, includeSubDomains: true, preload: true },
      frameguard: { action: "sameorigin" },
      noSniff: true,
      referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    }),
  );

  app.setGlobalPrefix("api");

  const config = app.get(ConfigService);
  const port = config.get<number>("PORT", 4000);
  const webOrigin = config.get<string>("WEB_ORIGIN", "http://localhost:3000");
  app.enableCors({ origin: webOrigin, credentials: true });

  const logger = createLogger();
  await app.listen(port);
  logger.info(`Brócolis API a escutar em http://localhost:${port}`);
}

void bootstrap();
