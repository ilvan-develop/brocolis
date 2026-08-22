import { describe, expect, it } from "vitest";
import { createPasswordHash, verifyPassword } from "./index.js";

const HASH_PATTERN = /^scrypt\$[0-9a-f]{32}\$[0-9a-f]{64}$/;

describe("password hashing (node:crypto scrypt)", () => {
  it("produz hash no formato scrypt$salt$hash", () => {
    const hash = createPasswordHash("senha-segura");
    expect(hash).toMatch(HASH_PATTERN);
  });

  it("verifica senha correta (round-trip)", () => {
    const hash = createPasswordHash("senha-segura");
    expect(verifyPassword("senha-segura", hash)).toBe(true);
  });

  it("rejeita senha errada", () => {
    const hash = createPasswordHash("senha-segura");
    expect(verifyPassword("outra-senha", hash)).toBe(false);
  });

  it("usa salt aleatório — hashes de senhas iguais diferem", () => {
    const a = createPasswordHash("senha-segura");
    const b = createPasswordHash("senha-segura");
    expect(a).not.toBe(b);
  });

  it("rejeita formato não-scrypt para evitar timing/salt injection", () => {
    expect(verifyPassword("senha", "plain$salt$hash")).toBe(false);
    expect(verifyPassword("senha", "")).toBe(false);
    expect(verifyPassword("senha", "scrypt$salt")).toBe(false);
  });

  it("funciona com unicode e caracteres especiais", () => {
    const hash = createPasswordHash("p@ss wörd-Ção!");
    expect(verifyPassword("p@ss wörd-Ção!", hash)).toBe(true);
    expect(verifyPassword("p@ss wörd-Çao!", hash)).toBe(false);
  });
});
