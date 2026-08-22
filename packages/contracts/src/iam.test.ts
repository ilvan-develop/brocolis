import { describe, expect, it } from "vitest";
import {
  sessionInfoSchema,
  sessionSchema,
  signInInputSchema,
  signUpInputSchema,
  userSchema,
  verifyEmailInputSchema,
} from "./iam.js";

const uuid = "00000000-0000-4000-8000-000000000000";
const cuid = "c1234567890abcdefghijkl";

describe("iam contracts", () => {
  it("valida userSchema completo", () => {
    const user = userSchema.parse({
      id: cuid,
      email: "ana@example.com",
      name: "Ana",
      marketCode: "AO",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    expect(user.status).toBe("PENDING");
    expect(user.emailVerified).toBe(false);
  });

  it("rejeita userSchema com email inválido", () => {
    expect(() =>
      userSchema.parse({
        id: cuid,
        email: "nao-e-um-email",
        name: "Ana",
        marketCode: "AO",
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    ).toThrow();
  });

  it("aplica idleTimeout de 30min por defeito na sessão", () => {
    const session = sessionSchema.parse({
      id: cuid,
      userId: cuid,
      token: "a".repeat(64),
      expiresAt: new Date(),
      createdAt: new Date(),
    });
    expect(session.idleTimeoutMinutes).toBe(30);
  });

  it("rejeita sessão com token fora do formato hex 64", () => {
    expect(() =>
      sessionSchema.parse({
        id: cuid,
        userId: cuid,
        token: "abc123",
        expiresAt: new Date(),
        createdAt: new Date(),
      }),
    ).toThrow();
  });

  it("aceita signUp com marketCode em maiúsculas", () => {
    const input = signUpInputSchema.parse({
      name: "Ana",
      email: "ana@example.com",
      password: "senha-segura",
      marketCode: "ao",
    });
    expect(input.marketCode).toBe("AO");
  });

  it("rejeita signUp com password curta (<8)", () => {
    expect(() =>
      signUpInputSchema.parse({
        name: "Ana",
        email: "ana@example.com",
        password: "1234567",
        marketCode: "AO",
      }),
    ).toThrow();
  });

  it("rejeita signUp sem marketCode (isolation de mercado)", () => {
    expect(() =>
      signUpInputSchema.parse({
        name: "Ana",
        email: "ana@example.com",
        password: "senha-segura",
      }),
    ).toThrow();
  });

  it("valida signIn com email e password", () => {
    const input = signInInputSchema.parse({
      email: "ana@example.com",
      password: "senha-segura",
    });
    expect(input.email).toBe("ana@example.com");
  });

  it("rejeita signIn com email inválido", () => {
    expect(() =>
      signInInputSchema.parse({ email: "x", password: "senha-segura" }),
    ).toThrow();
  });

  it("rejeita verifyEmail com token demasiado curto", () => {
    expect(() => verifyEmailInputSchema.parse({ token: "curto" })).toThrow();
  });

  it("valida sessionInfo com organizationId+marketCode+portal+roles", () => {
    const info = sessionInfoSchema.parse({
      userId: cuid,
      organizationId: uuid,
      marketCode: "AO",
      portal: "PHARMACY",
      roles: ["OWNER"],
    });
    expect(info.portal).toBe("PHARMACY");
  });

  it("rejeita sessionInfo sem organizationId (tenant isolation)", () => {
    expect(() =>
      sessionInfoSchema.parse({
        userId: cuid,
        marketCode: "AO",
        portal: "PHARMACY",
        roles: ["OWNER"],
      }),
    ).toThrow();
  });

  it("rejeita sessionInfo com roles vazias", () => {
    expect(() =>
      sessionInfoSchema.parse({
        userId: cuid,
        organizationId: uuid,
        marketCode: "AO",
        portal: "PHARMACY",
        roles: [],
      }),
    ).toThrow();
  });
});
