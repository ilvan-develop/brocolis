import { describe, expect, it } from "vitest";
import {
  isSettled,
  PAYMENT_STATUS_BADGE,
  PAYMENT_STATUS_KEY,
  paymentStatusBadgeVariant,
  paymentStatusKey,
} from "./payment-status";

describe("payment-status — mapas", () => {
  it("mapeia cada estado para a chave i18n", () => {
    expect(paymentStatusKey("PENDING")).toBe("payment.status.pending");
    expect(paymentStatusKey("CONFIRMED")).toBe("payment.status.confirmed");
    expect(paymentStatusKey("FAILED")).toBe("payment.status.failed");
    expect(paymentStatusKey("REFUNDED")).toBe("payment.status.refunded");
  });

  it("PAYMENT_STATUS_KEY cobre todos os estados", () => {
    expect(Object.keys(PAYMENT_STATUS_KEY)).toHaveLength(4);
  });

  it("mapeia para variantes de Badge", () => {
    expect(paymentStatusBadgeVariant("FAILED")).toBe("destructive");
    expect(paymentStatusBadgeVariant("CONFIRMED")).toBe("default");
    expect(PAYMENT_STATUS_BADGE.PENDING).toBe("secondary");
    expect(PAYMENT_STATUS_BADGE.REFUNDED).toBe("outline");
  });

  it("estado liquidado é confirmado ou reembolsado", () => {
    expect(isSettled("CONFIRMED")).toBe(true);
    expect(isSettled("REFUNDED")).toBe(true);
    expect(isSettled("PENDING")).toBe(false);
    expect(isSettled("FAILED")).toBe(false);
  });
});
