import * as Sentry from "@sentry/nestjs";

const dsn = process.env.SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment:
      process.env.SENTRY_ENVIRONMENT ?? process.env.NODE_ENV ?? "development",
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
    enableLogs: true,
    beforeSend(event) {
      if (event.request?.headers) {
        const auth = event.request.headers.authorization;
        if (auth) {
          event.request.headers.authorization = "[Filtered]";
        }
      }
      return event;
    },
  });
}
