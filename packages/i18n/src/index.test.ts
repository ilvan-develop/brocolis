import { describe, expect, it } from "vitest";
import { t } from "./index.js";

describe("i18n", () => {
  it("resolve pt-AO por defeito", () => {
    expect(t("checkout.title")).toBe("Finalizar pedido");
  });

  it("resolve por locale específico", () => {
    expect(t("checkout.title", "en-KE")).toBe("Checkout");
  });

  it("suporta RTL (ar-EG)", () => {
    expect(t("common.cart", "ar-EG")).toBe("السلة");
  });
});

describe("i18n — commerce (F-DS)", () => {
  it("resolve chaves novas em pt-AO", () => {
    expect(t("banner.offline")).toBe("Sem conexão");
    expect(t("commerce.stock.available")).toBe("Disponível");
    expect(t("commerce.stock.low")).toBe("Stock baixo");
    expect(t("checkout.summary")).toBe("Resumo do pedido");
    expect(t("order.status.delivered")).toBe("Entregue");
    expect(t("pharmacy.verified")).toBe("Farmácia verificada");
  });

  it("respeita a voz pt-AO (sem anglicismos)", () => {
    expect(t("product.add")).toBe("Adicionar");
    expect(t("cart.title")).toBe("Carrinho");
    expect(t("product.price")).toBe("Preço");
  });

  it("resolve em en-KE e en-NG", () => {
    expect(t("commerce.stock.available", "en-KE")).toBe("In stock");
    expect(t("order.status.in_transit", "en-KE")).toBe("In transit");
    expect(t("checkout.title", "en-NG")).toBe("Checkout");
  });

  it("resolve chaves novas em ar-EG (RTL)", () => {
    expect(t("cart.empty", "ar-EG")).toBe("سلتك فارغة");
    expect(t("pharma.whatsApp.support", "ar-EG")).toBe("الدعم عبر واتساب");
  });
});

describe("i18n — auth/session/onboarding (F1 web)", () => {
  it("resolve chaves de auth em pt-AO", () => {
    expect(t("auth.signin.title")).toBe("Entrar");
    expect(t("auth.signup.confirm")).toBe("Confirmar password");
    expect(t("auth.error.passwordShort")).toBe(
      "A password deve ter pelo menos 8 caracteres",
    );
  });

  it("resolve chaves de sessão e org-switcher em pt-AO", () => {
    expect(t("session.status.loading")).toBe("A carregar sessão");
    expect(t("org.switcher.active")).toBe("Ativa");
    expect(t("common.signout")).toBe("Terminar sessão");
  });

  it("resolve chaves de onboarding e membros em en-KE", () => {
    expect(t("onboarding.next", "en-KE")).toBe("Continue");
    expect(t("members.invite", "en-KE")).toBe("Invite member");
    expect(t("dashboard.title", "en-KE")).toBe("Dashboard");
  });

  it("resolve em ar-EG (RTL) mantém a paridade de chaves", () => {
    expect(t("auth.signin.forgot", "ar-EG")).toBe("نسيت كلمة المرور؟");
    expect(t("members.empty", "ar-EG")).toBe("لا يوجد أعضاء بعد.");
  });
});
