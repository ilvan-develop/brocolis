import type { FinPayAdapter, CreateIntentInput, FinpayIntent } from "./index.js";

export type HttpFinPayOptions = {
  baseUrl: string;
  apiKey: string | undefined;
};

const STATUS_VALUES = ["PENDING", "PROCESSING", "CONFIRMED", "EXPIRED", "DECLINED", "FAILED", "REFUNDED"] as const;

function toStatus(value: unknown): FinpayIntent["status"] {
  const status = String(value ?? "PENDING").toUpperCase();
  return STATUS_VALUES.includes(status as (typeof STATUS_VALUES)[number])
    ? (status as (typeof STATUS_VALUES)[number])
    : "PENDING";
}

export class HttpFinPayAdapter implements FinPayAdapter {
  private readonly baseUrl: string;
  private readonly apiKey: string | undefined;

  constructor(options: HttpFinPayOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, "");
    this.apiKey = options.apiKey;
  }

  async createIntent(input: CreateIntentInput): Promise<FinpayIntent> {
    const currency = (input.currency ?? "AOA").toUpperCase();
    const body = {
      organizationId: input.organizationId,
      clientReference: input.orderId,
      amount: { amount: input.amountMinor, currency },
      method: input.paymentMethod ?? "CARD",
      idempotencyKey: input.idempotencyKey ?? `order:${input.orderId}`,
    };
    const response = await fetch(`${this.baseUrl}/api/payments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {}),
      },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`FinPay createIntent failed: ${response.status} ${text}`);
    }
    const data = (await response.json()) as Record<string, unknown>;
    return {
      intentId: String(data.id ?? data.intentId ?? ""),
      orderId: input.orderId,
      amountMinor: input.amountMinor,
      currency: input.currency ?? "AOA",
      status: toStatus(data.status),
      paymentMethod: input.paymentMethod,
      organizationId: input.organizationId,
      marketCode: input.marketCode,
      createdAt: String(data.createdAt ?? new Date().toISOString()),
    };
  }

  async getIntent(intentId: string): Promise<FinpayIntent> {
    const response = await fetch(`${this.baseUrl}/api/payments/${intentId}`, {
      headers: {
        ...(this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {}),
      },
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`FinPay getIntent failed: ${response.status} ${text}`);
    }
    const data = (await response.json()) as Record<string, unknown>;
    const amount = (data.amount ?? data.controlAmount) as Record<string, unknown> | undefined;
    return {
      intentId: String(data.id ?? data.intentId ?? intentId),
      orderId: String(data.orderId ?? data.clientReference ?? ""),
      amountMinor: Number(amount?.amount ?? data.controlAmount ?? 0),
      currency: String(amount?.currency ?? data.currency ?? "AOA"),
      status: toStatus(data.status),
      paymentMethod: (data.method ?? data.paymentMethod) as string | undefined,
      organizationId: String(data.organizationId ?? ""),
      marketCode: String(data.marketCode ?? ""),
      createdAt: String(data.createdAt ?? ""),
    };
  }

  async refund(intentId: string): Promise<FinpayIntent> {
    const response = await fetch(`${this.baseUrl}/api/payments/${intentId}/refund`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {}),
      },
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`FinPay refund failed: ${response.status} ${text}`);
    }
    const data = (await response.json()) as Record<string, unknown>;
    const amount = (data.amount ?? data.controlAmount) as Record<string, unknown> | undefined;
    return {
      intentId: String(data.id ?? data.intentId ?? intentId),
      orderId: String(data.orderId ?? data.clientReference ?? ""),
      amountMinor: Number(amount?.amount ?? data.controlAmount ?? 0),
      currency: String(amount?.currency ?? data.currency ?? "AOA"),
      status: "REFUNDED",
      paymentMethod: (data.method ?? data.paymentMethod) as string | undefined,
      organizationId: String(data.organizationId ?? ""),
      marketCode: String(data.marketCode ?? ""),
      createdAt: String(data.createdAt ?? ""),
    };
  }
}
