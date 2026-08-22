import { describe, expect, it } from "vitest";
import {
  canTransition,
  isCanceled,
  isTerminal,
  ORDER_STATUS_BADGE,
  ORDER_STATUS_FLOW,
  ORDER_STATUS_KEY,
  orderStatusBadgeVariant,
  orderStatusKey,
} from "./order-status";

describe("order-status — mapas", () => {
  it("define o fluxo de estados", () => {
    expect(ORDER_STATUS_FLOW).toEqual([
      "PENDING",
      "CONFIRMED",
      "PROCESSING",
      "IN_TRANSIT",
      "DELIVERED",
      "CANCELED",
    ]);
  });

  it("mapeia cada estado para a chave i18n", () => {
    expect(orderStatusKey("PENDING")).toBe("order.status.pending");
    expect(orderStatusKey("CONFIRMED")).toBe("order.status.confirmed");
    expect(orderStatusKey("PROCESSING")).toBe("order.status.preparing");
    expect(orderStatusKey("IN_TRANSIT")).toBe("order.status.in_transit");
    expect(orderStatusKey("DELIVERED")).toBe("order.status.delivered");
    expect(orderStatusKey("CANCELED")).toBe("order.status.canceled");
  });

  it("ORDER_STATUS_KEY cobre todos os estados", () => {
    expect(Object.keys(ORDER_STATUS_KEY)).toHaveLength(
      ORDER_STATUS_FLOW.length,
    );
  });

  it("mapeia para variantes de Badge", () => {
    expect(orderStatusBadgeVariant("CANCELED")).toBe("destructive");
    expect(orderStatusBadgeVariant("DELIVERED")).toBe("outline");
    expect(orderStatusBadgeVariant("CONFIRMED")).toBe("default");
    expect(ORDER_STATUS_BADGE.IN_TRANSIT).toBe("default");
    expect(ORDER_STATUS_BADGE.PENDING).toBe("secondary");
  });
});

describe("order-status — progressão", () => {
  it("estados terminais são entregue e cancelado", () => {
    expect(isTerminal("DELIVERED")).toBe(true);
    expect(isTerminal("CANCELED")).toBe(true);
    expect(isTerminal("PROCESSING")).toBe(false);
  });

  it("isCanceled identifica cancelamento", () => {
    expect(isCanceled("CANCELED")).toBe(true);
    expect(isCanceled("DELIVERED")).toBe(false);
  });

  it("avanços lineares são permitidos", () => {
    expect(canTransition("PENDING", "CONFIRMED")).toBe(true);
    expect(canTransition("CONFIRMED", "PROCESSING")).toBe(true);
    expect(canTransition("PROCESSING", "IN_TRANSIT")).toBe(true);
    expect(canTransition("IN_TRANSIT", "DELIVERED")).toBe(true);
  });

  it("saltos para a frente também são permitidos (estados omitidos)", () => {
    expect(canTransition("PENDING", "IN_TRANSIT")).toBe(true);
    expect(canTransition("CONFIRMED", "DELIVERED")).toBe(true);
  });

  it("regressões são inválidas", () => {
    expect(canTransition("DELIVERED", "IN_TRANSIT")).toBe(false);
    expect(canTransition("PROCESSING", "PENDING")).toBe(false);
  });

  it("cancelado é terminal e não admite transições", () => {
    expect(canTransition("CANCELED", "DELIVERED")).toBe(false);
    expect(canTransition("PENDING", "CANCELED")).toBe(false);
  });

  it("transição para o mesmo estado é inválida", () => {
    expect(canTransition("PENDING", "PENDING")).toBe(false);
  });
});
