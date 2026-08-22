import { init } from "@sentry/nextjs";

init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});
