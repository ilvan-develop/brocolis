import { randomUUID } from "node:crypto";

export function mkOrgId(): string {
  return randomUUID();
}

export function mkMarketCode(code = "AO"): string {
  return code.toUpperCase();
}

export function mkReference(prefix = "ORD"): string {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}`;
}

export function mkCuid(seed = "test"): string {
  return `c${seed}${randomUUID().replaceAll("-", "").slice(0, 20)}`;
}
