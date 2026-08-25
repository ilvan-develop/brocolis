import { defaultLocale } from "@brocolis/i18n";
import { getLocale, setLocale, t } from "@/lib/i18n";

afterEach(() => {
  setLocale(defaultLocale);
});

describe("mobile lib/i18n (thin wrapper over @brocolis/i18n)", () => {
  it("defaults to the shared defaultLocale", () => {
    expect(getLocale()).toBe(defaultLocale);
  });

  it("resolves a message key using the central @brocolis/i18n dictionary", () => {
    expect(t("checkout.title")).toBe("Finalizar pedido");
  });

  it("does not maintain its own separate translation dictionary", () => {
    // Regression guard: catalog.subtitle differs per market in the shared
    // @brocolis/i18n dictionary. If mobile ever reintroduces a local,
    // hand-copied dictionary, it will drift from this and this test breaks.
    setLocale("pt-AO");
    expect(t("catalog.subtitle")).toContain("Angola");

    setLocale("pt-MZ");
    expect(t("catalog.subtitle")).toContain("Moçambique");
  });

  it("falls back to the key itself for an unknown key at runtime", () => {
    // @ts-expect-error deliberately invalid key to test the fallback branch
    expect(t("this.key.does.not.exist")).toBe("this.key.does.not.exist");
  });

  it("setLocale/getLocale round-trip", () => {
    setLocale("en-KE");
    expect(getLocale()).toBe("en-KE");
  });
});
