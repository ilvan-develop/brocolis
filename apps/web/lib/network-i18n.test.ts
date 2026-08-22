import type { Locale } from "@brocolis/i18n";
import { describe, expect, it } from "vitest";
import { NETWORK_MESSAGES, tNetwork } from "./network-i18n";

const LOCALES: readonly Locale[] = [
  "pt-AO",
  "pt-MZ",
  "en-KE",
  "en-NG",
  "fr-SN",
  "ar-EG",
];

describe("network-i18n — paridade de locales", () => {
  it("todos os locales têm exatamente as mesmas chaves", () => {
    const reference = Object.keys(NETWORK_MESSAGES["pt-AO"]).sort();
    for (const locale of LOCALES) {
      expect(Object.keys(NETWORK_MESSAGES[locale]).sort()).toEqual(reference);
    }
  });

  it("cobre os prefixos network.* esperados", () => {
    const keys = Object.keys(NETWORK_MESSAGES["pt-AO"]);
    expect(keys).toContain("network.timeline.title");
    expect(keys).toContain("network.stage.supplier_pull");
    expect(keys).toContain("network.status.delayed");
    expect(keys).toContain("network.party.pharmacy");
    expect(keys).toContain("network.stock.supplier_pull");
    expect(keys.every((key) => key.startsWith("network."))).toBe(true);
  });

  it("tNetwork devolve tradução por locale", () => {
    expect(tNetwork("network.stage.delivery", "pt-AO")).toBe("Entrega");
    expect(tNetwork("network.stage.delivery", "en-KE")).toBe("Delivery");
    expect(tNetwork("network.status.delayed", "fr-SN")).toBe("Retardée");
  });
});
