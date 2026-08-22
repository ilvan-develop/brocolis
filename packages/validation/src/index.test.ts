import { describe, expect, it } from "vitest";
import { requiredSecretSchema, validateEnv } from "./index.js";

describe("validateEnv", () => {
  const base = {
    DATABASE_URL: "postgresql://postgres:postgres@localhost:15432/brocolis",
    BETTER_AUTH_SECRET: "um-segredo-real-e-longo-123",
    BETTER_AUTH_URL: "http://localhost:4000",
  };

  it("aceita um env mínimo válido com defaults", () => {
    const env = validateEnv(base);
    expect(env.BROCOLIS_MARKET).toBe("AO");
    expect(env.FINPAY_MODE).toBe("mock");
    expect(env.PORT).toBe(4000);
  });

  it("rejeita BETTER_AUTH_SECRET placeholder", () => {
    expect(() =>
      validateEnv({ ...base, BETTER_AUTH_SECRET: "<trocar_obrigatoriamente>" }),
    ).toThrow(/BETTER_AUTH_SECRET/);
  });

  it("rejeita DATABASE_URL vazia", () => {
    expect(() => validateEnv({ ...base, DATABASE_URL: "" })).toThrow();
  });
});

describe("requiredSecretSchema", () => {
  it("rejeita valores curtos", () => {
    expect(() => requiredSecretSchema("X").parse("abc")).toThrow();
  });
});
