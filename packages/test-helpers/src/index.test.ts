import { describe, expect, it } from "vitest";
import { mkCuid, mkMarketCode, mkOrgId } from "./index.js";

describe("test-helpers", () => {
  it("gera organizationId UUID válido", () => {
    expect(mkOrgId()).toMatch(/^[0-9a-f-]{36}$/);
  });

  it("normaliza marketCode para maiúsculas", () => {
    expect(mkMarketCode("ao")).toBe("AO");
  });

  it("gera cuid-like", () => {
    expect(mkCuid()).toMatch(/^c/);
  });
});
