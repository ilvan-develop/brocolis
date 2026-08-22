import { randomBytes } from "node:crypto";

export type FinpayIntentStatus =
  | "PENDING"
  | "PROCESSING"
  | "CONFIRMED"
  | "EXPIRED"
  | "DECLINED"
  | "FAILED"
  | "REFUNDED";

export type FinpayEventType = "CONFIRMED" | "FAILED";

export type CreateIntentInput = {
  orderId: string;
  amountMinor: number;
  currency?: string;
  paymentMethod?: string;
  organizationId: string;
  marketCode: string;
  idempotencyKey?: string;
};

export type FinpayIntent = {
  intentId: string;
  orderId: string;
  amountMinor: number;
  currency: string;
  status: FinpayIntentStatus;
  paymentMethod?: string;
  organizationId: string;
  marketCode: string;
  createdAt: string;
};

export type FinpayWebhookEvent = {
  eventId: string;
  eventType: FinpayEventType;
  intentId: string;
  orderId: string;
  amountMinor: number;
  currency: string;
};

export type FinPayStore = {
  intents: Map<string, FinpayIntent>;
  events: Map<string, FinpayWebhookEvent>;
  byOrder: Map<string, string>;
  byIdempotency: Map<string, string>;
};

export function createFinpayStore(): FinPayStore {
  return {
    intents: new Map(),
    events: new Map(),
    byOrder: new Map(),
    byIdempotency: new Map(),
  };
}

export interface FinPayAdapter {
  createIntent(input: CreateIntentInput): Promise<FinpayIntent>;
  getIntent(intentId: string): Promise<FinpayIntent>;
  refund(intentId: string): Promise<FinpayIntent>;
}

let sequence = 0;

function nextId(prefix: string): string {
  sequence += 1;
  const suffix = randomBytes(2).toString("hex");
  return `${prefix}_${sequence.toString().padStart(8, "0")}_${suffix}`;
}

export class FinPayMockProvider implements FinPayAdapter {
  private readonly store: FinPayStore;
  private readonly delayMs: number;

  constructor(store: FinPayStore = createFinpayStore(), delayMs = 0) {
    this.store = store;
    this.delayMs = delayMs;
  }

  get storeRef(): FinPayStore {
    return this.store;
  }

  async createIntent(input: CreateIntentInput): Promise<FinpayIntent> {
    await this.wait();
    const currency = input.currency?.toUpperCase() ?? "AOA";
    const key =
      input.idempotencyKey ??
      `${input.orderId}:${input.amountMinor}:${currency}`;
    const existingId = this.store.byIdempotency.get(key);
    if (existingId) {
      const existing = this.store.intents.get(existingId);
      if (existing) {
        return { ...existing };
      }
    }
    const intent: FinpayIntent = {
      intentId: nextId("fp"),
      orderId: input.orderId,
      amountMinor: input.amountMinor,
      currency,
      status: "PENDING",
      ...(input.paymentMethod != null && {
        paymentMethod: input.paymentMethod,
      }),
      organizationId: input.organizationId,
      marketCode: input.marketCode,
      createdAt: new Date().toISOString(),
    };
    this.store.intents.set(intent.intentId, intent);
    this.store.byIdempotency.set(key, intent.intentId);
    this.store.byOrder.set(input.orderId, intent.intentId);
    return { ...intent };
  }

  async getIntent(intentId: string): Promise<FinpayIntent> {
    await this.wait();
    const intent = this.store.intents.get(intentId);
    if (!intent) {
      throw new Error(`FinPay mock: intent não encontrada (${intentId})`);
    }
    return { ...intent };
  }

  async webhookConfirm(intentId: string): Promise<FinpayWebhookEvent> {
    await this.wait();
    const intent = this.requireIntent(intentId);
    if (intent.status !== "CONFIRMED") {
      intent.status = "CONFIRMED";
    }
    return this.emit(intent, "CONFIRMED");
  }

  async webhookFail(intentId: string): Promise<FinpayWebhookEvent> {
    await this.wait();
    const intent = this.requireIntent(intentId);
    if (intent.status !== "FAILED") {
      intent.status = "FAILED";
    }
    return this.emit(intent, "FAILED");
  }

  async refund(intentId: string): Promise<FinpayIntent> {
    await this.wait();
    const intent = this.requireIntent(intentId);
    if (intent.status !== "CONFIRMED") {
      throw new Error(
        `FinPay mock: refund apenas de intents CONFIRMED (${intentId})`,
      );
    }
    intent.status = "REFUNDED";
    return { ...intent };
  }

  private requireIntent(intentId: string): FinpayIntent {
    const intent = this.store.intents.get(intentId);
    if (!intent) {
      throw new Error(`FinPay mock: intent não encontrada (${intentId})`);
    }
    return intent;
  }

  private emit(
    intent: FinpayIntent,
    eventType: FinpayEventType,
  ): FinpayWebhookEvent {
    const saved = this.store.events.get(intent.intentId);
    if (saved && saved.eventType === eventType) {
      return saved;
    }
    const event: FinpayWebhookEvent = {
      eventId: nextId("evt"),
      eventType,
      intentId: intent.intentId,
      orderId: intent.orderId,
      amountMinor: intent.amountMinor,
      currency: intent.currency,
    };
    this.store.events.set(intent.intentId, event);
    return event;
  }

  private async wait(): Promise<void> {
    if (this.delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.delayMs));
    }
  }
}

export const finpay = new FinPayMockProvider();
