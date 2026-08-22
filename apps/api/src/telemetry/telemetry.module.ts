import { NodeSDK } from "@opentelemetry/sdk-node";
import { ExpressInstrumentation } from "@opentelemetry/instrumentation-express";
import { HttpInstrumentation } from "@opentelemetry/instrumentation-http";

export function setupTelemetry() {
  const sdk = new NodeSDK({
    instrumentations: [new HttpInstrumentation(), new ExpressInstrumentation()],
    serviceName: "brocolis-api",
  });
  sdk.start();
  return sdk;
}
