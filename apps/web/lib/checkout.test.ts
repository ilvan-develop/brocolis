import { describe, expect, it } from "vitest";
import {
  ALLOWED_TRANSITIONS,
  CHECKOUT_FLOW,
  CHECKOUT_PERSIST_VERSION,
  CHECKOUT_STEP_IDS,
  CHECKOUT_STEP_INDEX,
  CHECKOUT_STEP_KEY,
  type CheckoutState,
  canGoTo,
  canProceed,
  confirmPayment,
  createCheckoutState,
  deserializeCheckout,
  fromStored,
  goTo,
  isComplete,
  isValidClient,
  isValidDelivery,
  nextStep,
  placeOrder,
  previousStep,
  selectPharmacy,
  serializeCheckout,
  setClientData,
  setDeliveryData,
  setPaymentMethod,
  setPrescription,
  toStored,
} from "./checkout";

const CLIENT = { fullName: "Ana Manuel", phone: "923000001" };
const DELIVERY = {
  zone: "urban",
  street: "Rua da Samba",
  houseNumber: "12",
  city: "Luanda",
  referencePoint: "Ao lado da padaria",
};
const PHARMACY = { pharmacyId: "c20000000000000000000001" };
const PRESCRIPTION = { status: "uploaded", fileName: "receita.jpg" } as const;

function atStep(step: CheckoutState["step"]): CheckoutState {
  const state = createCheckoutState();
  return { ...state, step };
}

function reach(_step: CheckoutState["step"]): CheckoutState {
  let state = createCheckoutState();
  state = setClientData(state, CLIENT);
  state = nextStep(state); // entrega
  state = setDeliveryData(state, DELIVERY);
  state = nextStep(state); // farmacia
  state = selectPharmacy(state, PHARMACY);
  state = nextStep(state); // receita
  state = setPrescription(state, PRESCRIPTION);
  state = nextStep(state); // pagamento
  state = setPaymentMethod(state, "REFERENCE");
  state = confirmPayment(state);
  state = nextStep(state); // review
  return state;
}

function atPagamento(): CheckoutState {
  let state = createCheckoutState();
  state = setClientData(state, CLIENT);
  state = nextStep(state); // entrega
  state = setDeliveryData(state, DELIVERY);
  state = nextStep(state); // farmacia
  state = selectPharmacy(state, PHARMACY);
  state = nextStep(state); // receita
  state = setPrescription(state, PRESCRIPTION);
  state = nextStep(state); // pagamento
  return state;
}

describe("checkout — estrutura", () => {
  it("tem exatamente 7 passos por ordem", () => {
    expect(CHECKOUT_FLOW).toEqual([
      "cliente",
      "entrega",
      "farmacia",
      "receita",
      "pagamento",
      "review",
      "confirmacao",
    ]);
    expect(CHECKOUT_STEP_IDS).toHaveLength(7);
  });

  it("índice é sequencial", () => {
    expect(CHECKOUT_STEP_INDEX.cliente).toBe(0);
    expect(CHECKOUT_STEP_INDEX.confirmacao).toBe(6);
  });

  it("cada passo tem tradução i18n", () => {
    for (const step of CHECKOUT_FLOW) {
      expect(CHECKOUT_STEP_KEY[step]).toMatch(/^checkout\.step\./);
    }
  });

  it("estado inicial é cliente sem dados", () => {
    const state = createCheckoutState();
    expect(state.step).toBe("cliente");
    expect(canProceed(state)).toBe(false);
  });
});

describe("checkout — validação por passo", () => {
  it("cliente exige nome e telefone", () => {
    expect(isValidClient(null)).toBe(false);
    expect(isValidClient({ fullName: "Ana", phone: "" })).toBe(false);
    expect(isValidClient(CLIENT)).toBe(true);
  });

  it("entrega exige zona, rua e número", () => {
    expect(isValidDelivery(null)).toBe(false);
    expect(
      isValidDelivery({ zone: "urban", street: "Rua", houseNumber: "" }),
    ).toBe(false);
    expect(isValidDelivery(DELIVERY)).toBe(true);
  });

  it("farmácia e receita exigem seleção", () => {
    expect(canProceed(atStep("farmacia"))).toBe(false);
    expect(canProceed(selectPharmacy(atStep("farmacia"), PHARMACY))).toBe(true);
    expect(canProceed(atStep("receita"))).toBe(false);
    expect(canProceed(setPrescription(atStep("receita"), PRESCRIPTION))).toBe(
      true,
    );
  });

  it("pagamento exige método confirmado; revisão reutiliza", () => {
    const semConfirmacao = setPaymentMethod(atStep("pagamento"), "COD");
    expect(canProceed(semConfirmacao)).toBe(false);
    expect(canProceed(confirmPayment(semConfirmacao))).toBe(true);
    expect(
      canProceed({ ...confirmPayment(semConfirmacao), step: "review" }),
    ).toBe(true);
  });
});

describe("checkout — transições forward", () => {
  it("avança passo a passo preenchendo os dados", () => {
    let state = createCheckoutState();
    expect(nextStep(state).step).toBe("cliente"); // bloqueado
    state = setClientData(state, CLIENT);
    state = nextStep(state);
    expect(state.step).toBe("entrega");
    state = setDeliveryData(state, DELIVERY);
    state = nextStep(state);
    expect(state.step).toBe("farmacia");
    state = selectPharmacy(state, PHARMACY);
    state = nextStep(state);
    expect(state.step).toBe("receita");
    state = setPrescription(state, PRESCRIPTION);
    state = nextStep(state);
    expect(state.step).toBe("pagamento");
    state = setPaymentMethod(state, "REFERENCE");
    state = confirmPayment(state);
    state = nextStep(state);
    expect(state.step).toBe("review");
    state = nextStep(state);
    expect(state.step).toBe("confirmacao");
    expect(nextStep(state).step).toBe("confirmacao"); // estável no fim
  });

  it("não avança sem preencher o passo atual", () => {
    const state = setClientData(createCheckoutState(), CLIENT);
    const stuck = nextStep(state);
    expect(stuck.step).toBe("entrega");

    const semEntrega = { ...stuck, delivery: null };
    expect(nextStep(semEntrega).step).toBe("entrega");
  });

  it("confirmar pagamento marca o passo e mantém método", () => {
    const state = confirmPayment(
      setPaymentMethod(createCheckoutState(), "MOBILE"),
    );
    expect(state.payment?.confirmed).toBe(true);
    expect(state.payment?.method).toBe("MOBILE");
  });

  it("confirmPayment sem método não cria pagamento", () => {
    expect(confirmPayment(createCheckoutState()).payment).toBeNull();
  });
});

describe("checkout — transições backward", () => {
  it("volta um passo de cada vez", () => {
    expect(previousStep(reach("review")).step).toBe("pagamento");
    expect(previousStep(atPagamento()).step).toBe("receita");
    expect(previousStep({ ...atPagamento(), step: "farmacia" }).step).toBe(
      "entrega",
    );
    expect(previousStep(createCheckoutState()).step).toBe("cliente"); // bloqueado no início
  });

  it("mudar dados no meio não reseta os passos seguintes (dados retidos)", () => {
    const review = reach("review");
    const editado = setClientData(review, { ...CLIENT, fullName: "Ana Sousa" });
    expect(editado.step).toBe("review");
    expect(editado.client?.fullName).toBe("Ana Sousa");
  });
});

describe("checkout — canGoTo/goTo e transições permitidas", () => {
  it("permitido voltar para qualquer passo anterior", () => {
    const review = reach("review");
    expect(canGoTo(review, "cliente")).toBe(true);
    expect(canGoTo(review, "entrega")).toBe(true);
    expect(canGoTo(review, "farmacia")).toBe(true);
    expect(canGoTo(review, "receita")).toBe(true);
    expect(canGoTo(review, "pagamento")).toBe(true);
    expect(goTo(review, "cliente").step).toBe("cliente");
  });

  it("avançar mais de um passo é inválido", () => {
    const entrega = { ...reach("entrega"), step: "cliente" } as CheckoutState;
    expect(canGoTo(entrega, "farmacia")).toBe(false);
    expect(goTo(entrega, "farmacia").step).toBe("cliente");
  });

  it("avançar para o próximo exige dados válidos", () => {
    const cliente = createCheckoutState();
    expect(canGoTo(cliente, "entrega")).toBe(false);
    const preenchido = setClientData(cliente, CLIENT);
    expect(canGoTo(preenchido, "entrega")).toBe(true);
    expect(goTo(preenchido, "entrega").step).toBe("entrega");
  });

  it("passo para si próprio é inválido", () => {
    const review = reach("review");
    expect(canGoTo(review, "review")).toBe(false);
    expect(goTo(review, "review").step).toBe("review");
  });

  it("confirmacao só tem transições para trás", () => {
    const confirmacao = placeOrder(reach("review"), "ANG-1");
    expect(ALLOWED_TRANSITIONS.confirmacao).toHaveLength(6);
    expect(canProceed(confirmacao)).toBe(false);
  });

  it("ALLOWED_TRANSITIONS nunca contém o próprio passo", () => {
    for (const step of CHECKOUT_FLOW) {
      expect(ALLOWED_TRANSITIONS[step].includes(step)).toBe(false);
    }
  });
});

describe("checkout — placeOrder", () => {
  it("só avança para confirmação a partir da review", () => {
    const confirmado = placeOrder(reach("review"), "ANG-101");
    expect(confirmado.step).toBe("confirmacao");
    expect(confirmado.orderId).toBe("ANG-101");
    expect(isComplete(confirmado)).toBe(true);
  });

  it("recusa placeOrder fora da review ou sem confirmação", () => {
    const before = atPagamento();
    expect(placeOrder(before, "ANG-X").step).toBe("pagamento");
    const reviewSemConfirmar: CheckoutState = {
      ...reach("review"),
      payment: { method: "COD", confirmed: false },
    };
    expect(placeOrder(reviewSemConfirmar, "ANG-X").orderId).toBeNull();
  });

  it("gera um orderId quando não fornecido", () => {
    const confirmado = placeOrder(reach("review"));
    expect(confirmado.orderId).toMatch(/^ANG-/);
  });
});

describe("checkout — persistência", () => {
  it("serializa com versão", () => {
    const stored = toStored(atPagamento());
    expect(stored.version).toBe(CHECKOUT_PERSIST_VERSION);
    expect(stored.step).toBe("pagamento");
  });

  it("round-trip de serialize/deserialize preserva o estado", () => {
    const state = reach("review");
    const restored = deserializeCheckout(serializeCheckout(state));
    expect(restored).toEqual(state);
  });

  it("round-trip de fromStored preserva os passos de dados", () => {
    const state = reach("review");
    const restored = fromStored(toStored(state));
    expect(restored.client).toEqual(CLIENT);
    expect(restored.delivery).toEqual(DELIVERY);
    expect(restored.prescription).toEqual(PRESCRIPTION);
  });

  it("rejeita payloads inválidos", () => {
    expect(deserializeCheckout("")).toBeNull();
    expect(deserializeCheckout("{")).toBeNull();
    expect(
      deserializeCheckout(JSON.stringify({ version: 99, step: "cliente" })),
    ).toBeNull();
    expect(
      deserializeCheckout(JSON.stringify({ version: 1, step: "fora" })),
    ).toBeNull();
    expect(deserializeCheckout("null")).toBeNull();
  });

  it("preserva orderId persistido", () => {
    const confirmado = placeOrder(reach("review"), "ANG-42");
    const stored = serializeCheckout(confirmado);
    expect(deserializeCheckout(stored)?.orderId).toBe("ANG-42");
  });
});
