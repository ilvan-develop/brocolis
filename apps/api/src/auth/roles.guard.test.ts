import type { ExecutionContext } from "@nestjs/common";
import { ForbiddenException, UnauthorizedException } from "@nestjs/common";
import { describe, expect, it } from "vitest";
import { RolesGuard } from "./roles.guard.js";

function fakeContext(user: unknown): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
  } as unknown as ExecutionContext;
}

describe("RolesGuard", () => {
  it("permite quando a role exigida está presente", () => {
    const guard = new RolesGuard({
      portal: "PHARMACY",
      requiredRoles: ["OWNER", "ADMIN"],
    });
    const allowed = guard.canActivate(
      fakeContext({ userId: "u1", portal: "PHARMACY", roles: ["ADMIN"] }),
    );
    expect(allowed).toBe(true);
  });

  it("aceita estilo RolesGuard('PHARMACY')", () => {
    const guard = new RolesGuard("PHARMACY");
    expect(
      guard.canActivate(
        fakeContext({ userId: "u1", portal: "PHARMACY", roles: ["VIEWER"] }),
      ),
    ).toBe(true);
  });

  it("lança ForbiddenException quando a role exigida falta", () => {
    const guard = new RolesGuard({ requiredRoles: ["OWNER"] });
    expect(() =>
      guard.canActivate(fakeContext({ userId: "u1", roles: ["FINANCE"] })),
    ).toThrowError(ForbiddenException);
  });

  it("lança ForbiddenException em portal errado", () => {
    const guard = new RolesGuard("PHARMACY");
    expect(() =>
      guard.canActivate(
        fakeContext({ userId: "u1", portal: "SUPPLIER", roles: ["ADMIN"] }),
      ),
    ).toThrowError(ForbiddenException);
  });

  it("lança ForbiddenException quando falta permissão para a acção", () => {
    const guard = new RolesGuard({
      requiredActions: [{ resource: "payments", action: "refund" }],
    });
    expect(() =>
      guard.canActivate(fakeContext({ userId: "u1", roles: ["PHARMACIST"] })),
    ).toThrowError(ForbiddenException);
  });

  it("permite quando a acção/resource é autorizada pela role", () => {
    const guard = new RolesGuard({
      requiredActions: [{ resource: "prescription", action: "dispense" }],
    });
    expect(
      guard.canActivate(fakeContext({ userId: "u1", roles: ["PHARMACIST"] })),
    ).toBe(true);
  });

  it("lança UnauthorizedException sem sessão", () => {
    const guard = new RolesGuard({});
    expect(() => guard.canActivate(fakeContext(undefined))).toThrowError(
      UnauthorizedException,
    );
  });

  it("lança UnauthorizedException para utilizador sem roles", () => {
    const guard = new RolesGuard({});
    expect(() => guard.canActivate(fakeContext({}))).toThrowError(
      UnauthorizedException,
    );
  });
});
