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
  paymentMethod: string | undefined;
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

export interface FinPayAdapter {
  createIntent(input: CreateIntentInput): Promise<FinpayIntent>;
  getIntent(intentId: string): Promise<FinpayIntent>;
  refund(intentId: string): Promise<FinpayIntent>;
}

export function createFinpayStore(): FinPayStore {
  return {
    intents: new Map(),
    events: new Map(),
    byOrder: new Map(),
    byIdempotency: new Map(),
  };
}
