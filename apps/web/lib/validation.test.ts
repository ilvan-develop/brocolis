import { describe, expect, it } from "vitest";
import {
  validateEmail,
  validateEmailOnly,
  validatePassword,
  validateSignIn,
  validateSignUp,
} from "./validation";

describe("validation — email", () => {
  it("aceita email válido", () => {
    expect(validateEmail("ana@example.com")).toBe(true);
    expect(validateEmail(" joao.nome@dominio.ao ")).toBe(true);
  });

  it("rejeita email inválido", () => {
    expect(validateEmail("sem-arroba")).toBe(false);
    expect(validateEmail("ana@")).toBe(false);
    expect(validateEmail("ana@dominio")).toBe(false);
    expect(validateEmail("")).toBe(false);
  });
});

describe("validation — password", () => {
  it("aceita password com 8 ou mais caracteres", () => {
    expect(validatePassword("12345678")).toBe(true);
  });

  it("rejeita password curta (<8)", () => {
    expect(validatePassword("1234567")).toBe(false);
  });
});

describe("validation — sign-in", () => {
  it("valida sign-in válido sem erros", () => {
    const result = validateSignIn({
      email: "ana@example.com",
      password: "pass",
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual({});
  });

  it("reporta email inválido no sign-in", () => {
    const result = validateSignIn({ email: "x", password: "pass" });
    expect(result.valid).toBe(false);
    expect(result.errors.email).toBe("auth.error.invalidEmail");
  });

  it("reporta password em falta no sign-in", () => {
    const result = validateSignIn({ email: "ana@example.com", password: "" });
    expect(result.valid).toBe(false);
    expect(result.errors.password).toBe("auth.error.required");
  });
});

describe("validation — sign-up", () => {
  const base = {
    name: "Ana",
    email: "ana@example.com",
    password: "senha-segura",
    confirmPassword: "senha-segura",
  };

  it("valida sign-up válido", () => {
    const result = validateSignUp(base);
    expect(result.valid).toBe(true);
  });

  it("exige nome no sign-up", () => {
    const result = validateSignUp({ ...base, name: "  " });
    expect(result.valid).toBe(false);
    expect(result.errors.name).toBe("auth.error.required");
  });

  it("rejeita password curta no sign-up", () => {
    const result = validateSignUp({ ...base, password: "curto" });
    expect(result.valid).toBe(false);
    expect(result.errors.password).toBe("auth.error.passwordShort");
  });

  it("rejeita passwords não coincidentes", () => {
    const result = validateSignUp({
      ...base,
      confirmPassword: "outra-senha",
    });
    expect(result.valid).toBe(false);
    expect(result.errors.confirm).toBe("auth.error.passwordMismatch");
  });

  it("valida confirmação em falta como obrigatória", () => {
    const result = validateSignUp({ ...base, confirmPassword: "" });
    expect(result.valid).toBe(false);
    expect(result.errors.confirm).toBe("auth.error.required");
  });
});

describe("validation — email-only helper", () => {
  it("devolve válido para email correto", () => {
    const result = validateEmailOnly("ana@example.com");
    expect(result.valid).toBe(true);
  });

  it("devolve erro de email inválido", () => {
    const result = validateEmailOnly("nao-e-email");
    expect(result.valid).toBe(false);
    expect(result.errors.email).toBe("auth.error.invalidEmail");
  });
});
