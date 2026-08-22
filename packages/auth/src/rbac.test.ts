import { describe, expect, it } from "vitest";
import { can, hasRole } from "./index.js";

describe("RBAC — can(role, action, resource)", () => {
  it("permite pharmacist dispensar prescrições", () => {
    expect(can("PHARMACIST", "dispense", "prescription")).toBe(true);
    expect(can("PHARMACIST", "validate", "prescription")).toBe(true);
  });

  it("nega pharmacist reembolsar pagamentos", () => {
    expect(can("PHARMACIST", "refund", "payments")).toBe(false);
  });

  it("permite wildcard a OWNER", () => {
    expect(can("OWNER", "destroy", "todos")).toBe(true);
    expect(can("ADMIN", "manage", "tenant")).toBe(true);
  });

  it("permite view buyer criar procurement, nega aprovar", () => {
    expect(can("BUYER", "create", "procurement")).toBe(true);
    expect(can("BUYER", "approve", "procurement")).toBe(false);
  });

  it("permite view VIEWER leitura essencial, nega escrita", () => {
    expect(can("VIEWER", "read", "catalog")).toBe(true);
    expect(can("VIEWER", "write", "catalog")).toBe(false);
  });

  it("nega role desconhecida", () => {
    expect(can("ROOT", "read", "catalog")).toBe(false);
  });

  it("permite platform COMPLIANCE decidir compliance e auditar", () => {
    expect(can("COMPLIANCE", "decide", "compliance")).toBe(true);
    expect(can("COMPLIANCE", "read", "audit")).toBe(true);
  });

  it("nega COMPLIANCE gerir marketplace", () => {
    expect(can("COMPLIANCE", "manage", "marketplace")).toBe(false);
  });
});

describe("RBAC — hasRole", () => {
  it("deteta role requerida no conjunto", () => {
    expect(hasRole(["OWNER", "FINANCE"], "OWNER")).toBe(true);
    expect(hasRole(["FINANCE", "VIEWER"], "OWNER")).toBe(false);
  });

  it("comparação exacta, sem wildcard", () => {
    expect(hasRole(["*"], "OWNER")).toBe(false);
  });
});
