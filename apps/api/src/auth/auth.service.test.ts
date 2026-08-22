import { UnauthorizedException } from "@nestjs/common";
import { describe, expect, it } from "vitest";
import { AuthService } from "./auth.service.js";

const uuid = "00000000-0000-4000-8000-000000000000";

describe("AuthService", () => {
  it("valida credenciais corretas (scrypt round-trip)", async () => {
    const auth = new AuthService();
    auth.registerUser({
      userId: "u1",
      email: "ana@example.com",
      name: "Ana",
      password: "senha-segura",
      organizationId: uuid,
      marketCode: "AO",
      portal: "PHARMACY",
      roles: ["OWNER"],
    });

    const user = await auth.validateCredentials(
      "ana@example.com",
      "senha-segura",
    );
    expect(user.userId).toBe("u1");
  });

  it("rejeita credenciais com password errada", async () => {
    const auth = new AuthService();
    auth.registerUser({
      userId: "u1",
      email: "ana@example.com",
      name: "Ana",
      password: "senha-segura",
      organizationId: uuid,
      marketCode: "AO",
      portal: "PHARMACY",
      roles: ["OWNER"],
    });

    await expect(
      auth.validateCredentials("ana@example.com", "senha-errada"),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("rejeita email desconhecido", async () => {
    const auth = new AuthService();
    await expect(
      auth.validateCredentials("nao-existe@example.com", "senha-segura"),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("emite sessão com token hex64 e expiração futura", async () => {
    const auth = new AuthService();
    auth.registerUser({
      userId: "u1",
      email: "ana@example.com",
      name: "Ana",
      password: "senha-segura",
      organizationId: uuid,
      marketCode: "AO",
      portal: "PHARMACY",
      roles: ["OWNER"],
    });

    const { token, expiresAt } = await auth.issueSession("u1");
    expect(token).toMatch(/^[0-9a-f]{64}$/);
    expect(expiresAt.getTime()).toBeGreaterThan(Date.now());
    expect(auth.requireSession(token).userId).toBe("u1");
  });

  it("rejeita issueSession para utilizador desconhecido", async () => {
    const auth = new AuthService();
    await expect(auth.issueSession("ghost")).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it("rejeita sessão desconhecida no requireSession", () => {
    const auth = new AuthService();
    expect(() => auth.requireSession("token-invalido")).toThrowError(
      UnauthorizedException,
    );
  });

  it("revoga sessão emitida", async () => {
    const auth = new AuthService();
    auth.registerUser({
      userId: "u1",
      email: "ana@example.com",
      name: "Ana",
      password: "senha-segura",
      organizationId: uuid,
      marketCode: "AO",
      portal: "PHARMACY",
      roles: ["OWNER"],
    });
    const { token } = await auth.issueSession("u1");
    auth.revokeSession(token);
    expect(() => auth.requireSession(token)).toThrowError(
      UnauthorizedException,
    );
  });
});
