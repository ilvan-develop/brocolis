import { describe, expect, it } from "vitest";
import { createSessionToken, SESSION_IDLE_TIMEOUT_MINUTES } from "./index.js";

describe("session tokens", () => {
  it("gera token de 64 chars hex (32 bytes)", () => {
    const token = createSessionToken();
    expect(token).toMatch(/^[0-9a-f]{64}$/);
  });

  it("gera tokens únicos", () => {
    const a = createSessionToken();
    const b = createSessionToken();
    expect(a).not.toBe(b);
  });

  it("expõe idle timeout default de 30min", () => {
    expect(SESSION_IDLE_TIMEOUT_MINUTES).toBe(30);
  });
});
