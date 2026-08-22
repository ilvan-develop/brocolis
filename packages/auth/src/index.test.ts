import { describe, expect, it } from "vitest";
import { portalCodeSchema, wire } from "./index.js";

describe("auth", () => {
  it("aceita os 5 portais RBAC", () => {
    expect(portalCodeSchema.parse("PHARMACY")).toBe("PHARMACY");
    expect(portalCodeSchema.safeParse("ROOT").success).toBe(false);
  });

  it("expõe o contrato de arranque ainda não ligado (F1)", () => {
    expect(wire().ready).toBe(false);
  });
});
