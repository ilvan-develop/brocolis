import type { PaymentMethod } from "@brocolis/contracts";
import type { MessageKey } from "@brocolis/i18n";

export const CHECKOUT_STEP_IDS = [
  "cliente",
  "entrega",
  "farmacia",
  "receita",
  "pagamento",
  "review",
  "confirmacao",
] as const;

export type CheckoutStepId = (typeof CHECKOUT_STEP_IDS)[number];

export const PAYMENT_METHOD_KEY: Record<PaymentMethod, MessageKey> = {
  CARD: "payment.method.card",
  WALLET: "payment.method.wallet",
  REFERENCE: "payment.method.reference",
  COD: "payment.method.cod",
  MOBILE: "payment.method.mobile",
};

export const CHECKOUT_FLOW: readonly CheckoutStepId[] = CHECKOUT_STEP_IDS;

export const CHECKOUT_STEP_KEY: Record<CheckoutStepId, MessageKey> = {
  cliente: "checkout.step.cliente",
  entrega: "checkout.step.entrega",
  farmacia: "checkout.step.farmacia",
  receita: "checkout.step.receita",
  pagamento: "checkout.step.pagamento",
  review: "checkout.step.review",
  confirmacao: "checkout.step.confirmacao",
};

export const CHECKOUT_STEP_INDEX: Record<CheckoutStepId, number> = {
  cliente: 0,
  entrega: 1,
  farmacia: 2,
  receita: 3,
  pagamento: 4,
  review: 5,
  confirmacao: 6,
};

export type ClientData = {
  fullName: string;
  phone: string;
};

export type DeliveryData = {
  zone: string;
  street: string;
  houseNumber: string;
  city?: string;
  referencePoint?: string;
};

export type PharmacySelection = {
  pharmacyId: string;
};

export type PrescriptionData = {
  status: "not_required" | "uploaded";
  fileName?: string;
};

export type PaymentData = {
  method: PaymentMethod;
  confirmed: boolean;
};

export type CheckoutState = {
  step: CheckoutStepId;
  client: ClientData | null;
  delivery: DeliveryData | null;
  pharmacy: PharmacySelection | null;
  prescription: PrescriptionData | null;
  payment: PaymentData | null;
  orderId: string | null;
};

export function createCheckoutState(): CheckoutState {
  return {
    step: "cliente",
    client: null,
    delivery: null,
    pharmacy: null,
    prescription: null,
    payment: null,
    orderId: null,
  };
}

function isNonEmpty(value: string | null | undefined): boolean {
  return value !== null && value !== undefined && value.trim().length > 0;
}

export function isValidClient(data: ClientData | null): boolean {
  return data !== null && isNonEmpty(data.fullName) && isNonEmpty(data.phone);
}

export function isValidDelivery(data: DeliveryData | null): boolean {
  return (
    data !== null &&
    isNonEmpty(data.zone) &&
    isNonEmpty(data.street) &&
    isNonEmpty(data.houseNumber)
  );
}

export function canProceed(state: CheckoutState): boolean {
  switch (state.step) {
    case "cliente":
      return isValidClient(state.client);
    case "entrega":
      return isValidDelivery(state.delivery);
    case "farmacia":
      return state.pharmacy !== null;
    case "receita":
      return state.prescription !== null;
    case "pagamento":
      return state.payment?.confirmed ?? false;
    case "review":
      return state.payment?.confirmed ?? false;
    case "confirmacao":
      return false;
  }
}

function stepAt(index: number): CheckoutStepId | null {
  const step = CHECKOUT_FLOW[index];
  return step ?? null;
}

export function nextStep(state: CheckoutState): CheckoutState {
  if (state.step === "confirmacao" || !canProceed(state)) {
    return { ...state };
  }
  const next = stepAt(CHECKOUT_STEP_INDEX[state.step] + 1);
  if (next === null) {
    return { ...state };
  }
  return { ...state, step: next };
}

export function previousStep(state: CheckoutState): CheckoutState {
  const previous = stepAt(CHECKOUT_STEP_INDEX[state.step] - 1);
  if (previous === null) {
    return { ...state };
  }
  return { ...state, step: previous };
}

export const ALLOWED_TRANSITIONS: Record<
  CheckoutStepId,
  readonly CheckoutStepId[]
> = {
  cliente: [],
  entrega: ["cliente"],
  farmacia: ["cliente", "entrega"],
  receita: ["cliente", "entrega", "farmacia"],
  pagamento: ["cliente", "entrega", "farmacia", "receita"],
  review: ["cliente", "entrega", "farmacia", "receita", "pagamento"],
  confirmacao: [
    "cliente",
    "entrega",
    "farmacia",
    "receita",
    "pagamento",
    "review",
  ],
};

export function canGoTo(state: CheckoutState, target: CheckoutStepId): boolean {
  if (target === state.step) {
    return false;
  }
  if (ALLOWED_TRANSITIONS[state.step].includes(target)) {
    return true;
  }
  const forward = stepAt(CHECKOUT_STEP_INDEX[state.step] + 1);
  return target === forward && canProceed(state);
}

export function goTo(
  state: CheckoutState,
  target: CheckoutStepId,
): CheckoutState {
  if (!canGoTo(state, target)) {
    return { ...state };
  }
  return { ...state, step: target };
}

export function setClientData(
  state: CheckoutState,
  client: ClientData,
): CheckoutState {
  return { ...state, client };
}

export function setDeliveryData(
  state: CheckoutState,
  delivery: DeliveryData,
): CheckoutState {
  return { ...state, delivery };
}

export function selectPharmacy(
  state: CheckoutState,
  pharmacy: PharmacySelection,
): CheckoutState {
  return { ...state, pharmacy };
}

export function setPrescription(
  state: CheckoutState,
  prescription: PrescriptionData,
): CheckoutState {
  return { ...state, prescription };
}

export function setPaymentMethod(
  state: CheckoutState,
  method: PaymentMethod,
): CheckoutState {
  const payment: PaymentData = {
    method,
    confirmed: state.payment?.confirmed ?? false,
  };
  return { ...state, payment };
}

export function confirmPayment(state: CheckoutState): CheckoutState {
  if (state.payment === null) {
    return { ...state };
  }
  return { ...state, payment: { ...state.payment, confirmed: true } };
}

function generateOrderId(): string {
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `ANG-${Date.now().toString(36).toUpperCase()}${random}`;
}

export function placeOrder(
  state: CheckoutState,
  orderId?: string,
): CheckoutState {
  if (state.step !== "review" || !canProceed(state)) {
    return { ...state };
  }
  return {
    ...state,
    step: "confirmacao",
    orderId: orderId ?? generateOrderId(),
  };
}

export function isComplete(state: CheckoutState): boolean {
  return state.step === "confirmacao" && state.orderId !== null;
}

export const CHECKOUT_PERSIST_VERSION = 1;

export type StoredCheckoutV1 = {
  version: 1;
  step: CheckoutStepId;
  client: ClientData | null;
  delivery: DeliveryData | null;
  pharmacy: PharmacySelection | null;
  prescription: PrescriptionData | null;
  payment: PaymentData | null;
  orderId: string | null;
};

export function toStored(state: CheckoutState): StoredCheckoutV1 {
  return {
    version: CHECKOUT_PERSIST_VERSION,
    step: state.step,
    client: state.client,
    delivery: state.delivery,
    pharmacy: state.pharmacy,
    prescription: state.prescription,
    payment: state.payment,
    orderId: state.orderId,
  };
}

export function fromStored(stored: StoredCheckoutV1): CheckoutState {
  return {
    step: stored.step,
    client: stored.client,
    delivery: stored.delivery,
    pharmacy: stored.pharmacy,
    prescription: stored.prescription,
    payment: stored.payment,
    orderId: stored.orderId,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isStepId(value: unknown): value is CheckoutStepId {
  return (
    typeof value === "string" &&
    (CHECKOUT_STEP_IDS as readonly string[]).includes(value)
  );
}

function isValidStored(value: unknown): value is StoredCheckoutV1 {
  return (
    isRecord(value) &&
    value.version === CHECKOUT_PERSIST_VERSION &&
    isStepId(value.step)
  );
}

export function serializeCheckout(state: CheckoutState): string {
  return JSON.stringify(toStored(state));
}

export function deserializeCheckout(raw: string): CheckoutState | null {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isValidStored(parsed)) {
      return null;
    }
    return fromStored(parsed);
  } catch {
    return null;
  }
}
