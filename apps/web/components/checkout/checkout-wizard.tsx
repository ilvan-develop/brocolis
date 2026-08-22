"use client";

import type { PaymentMethod } from "@brocolis/contracts";
import { type MessageKey, t } from "@brocolis/i18n";
import { cn } from "@brocolis/ui";
import { Button } from "@brocolis/ui/components/button";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { computeSubtotal } from "@/lib/cart";
import {
  CHECKOUT_FLOW,
  CHECKOUT_STEP_INDEX,
  CHECKOUT_STEP_KEY,
  type CheckoutState,
  type ClientData,
  canGoTo,
  placeOrder as commitOrder,
  confirmPayment,
  createCheckoutState,
  type DeliveryData,
  deserializeCheckout,
  goTo,
  nextStep,
  type PrescriptionData,
  previousStep,
  selectPharmacy,
  serializeCheckout,
  setClientData,
  setDeliveryData,
  setPaymentMethod,
  setPrescription,
} from "@/lib/checkout";
import { distinctPharmacyIds } from "@/lib/storefront";
import { clearCart, useCartItems } from "@/lib/storefront-cart";
import { StepClient } from "./step-client";
import { StepConfirmation } from "./step-confirmation";
import { StepDelivery } from "./step-delivery";
import { StepPayment } from "./step-payment";
import { StepReview } from "./step-review";

export const CHECKOUT_STORAGE_KEY = "brocolis.checkout.v1";

type RadioOption = {
  value: string;
  label: MessageKey;
};

const PRESCRIPTION_OPTIONS: readonly RadioOption[] = [
  { value: "not_required", label: "prescription.notRequired" },
  { value: "uploaded", label: "prescription.uploaded" },
];

export function CheckoutWizard() {
  const cartItems = useCartItems();
  const [state, setState] = useState<CheckoutState>(createCheckoutState);
  const [mounted, setMounted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const raw = window.localStorage.getItem(CHECKOUT_STORAGE_KEY);
    const stored = raw !== null ? deserializeCheckout(raw) : null;
    if (stored !== null) {
      setState(stored);
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) {
      return;
    }
    window.localStorage.setItem(CHECKOUT_STORAGE_KEY, serializeCheckout(state));
  }, [mounted, state]);

  async function handlePlaceOrder(): Promise<void> {
    if (submittingRef.current) {
      return;
    }
    submittingRef.current = true;
    setSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 600));
    setState(commitOrder(state));
    clearCart();
    toast.success(t("orders.confirmation.title"));
    setSubmitting(false);
    submittingRef.current = false;
  }

  function submitOrder(): void {
    void handlePlaceOrder();
  }

  if (!mounted) {
    return null;
  }

  if (cartItems.length === 0 && state.step !== "confirmacao") {
    return (
      <div className="flex flex-col items-center gap-4 py-12 text-center">
        <p className="text-muted-foreground text-sm">{t("cart.empty")}</p>
        <Button asChild variant="outline">
          <Link href="/">{t("cart.continueShopping")}</Link>
        </Button>
      </div>
    );
  }

  const subtotal = computeSubtotal(cartItems);

  function commitClient(client: ClientData) {
    setState((current) => nextStep(setClientData(current, client)));
  }

  function commitDelivery(delivery: DeliveryData) {
    setState((current) => nextStep(setDeliveryData(current, delivery)));
  }

  function commitPayment(method: PaymentMethod) {
    setState((current) => {
      let next = setPaymentMethod(current, method);
      next = confirmPayment(next);
      return nextStep(next);
    });
  }

  function selectPharmacyStep(pharmacyId: string) {
    setState((current) => selectPharmacy(current, { pharmacyId }));
  }

  function submitPharmacyStep() {
    setState((current) => {
      if (current.pharmacy === null) {
        return current;
      }
      return nextStep(selectPharmacy(current, current.pharmacy));
    });
  }

  function setPrescriptionStep(option: RadioOption) {
    const prescription: PrescriptionData =
      option.value === "uploaded"
        ? { status: "uploaded", fileName: "receita.jpg" }
        : { status: "not_required" };
    setState((current) => setPrescription(current, prescription));
  }

  function submitPrescriptionStep() {
    setState((current) => {
      if (current.prescription === null) {
        return current;
      }
      return nextStep(setPrescription(current, current.prescription));
    });
  }

  const pharmacies = distinctPharmacyIds(cartItems);

  return (
    <div className="flex flex-col gap-6">
      <nav className="flex flex-wrap gap-2" aria-label={t("checkout.title")}>
        {CHECKOUT_FLOW.map((step) => {
          const active = state.step === step;
          const reachable = active || canGoTo(state, step);
          return (
            <button
              key={step}
              type="button"
              onClick={() => {
                if (canGoTo(state, step)) {
                  setState((current) => goTo(current, step));
                }
              }}
              disabled={!reachable}
              aria-current={active ? "step" : undefined}
              className={cn(
                "rounded-full px-3 py-1 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : reachable
                    ? "bg-muted text-muted-foreground hover:bg-accent"
                    : "bg-muted text-muted-foreground opacity-40",
              )}
            >
              {CHECKOUT_STEP_INDEX[step] + 1}. {t(CHECKOUT_STEP_KEY[step])}
            </button>
          );
        })}
      </nav>

      {state.step !== "cliente" && state.step !== "confirmacao" && (
        <Button
          type="button"
          variant="ghost"
          className="w-fit"
          onClick={() => setState((current) => previousStep(current))}
        >
          {t("checkout.back")}
        </Button>
      )}

      {state.step === "cliente" && (
        <StepClient values={state.client} onCommit={commitClient} />
      )}

      {state.step === "entrega" && (
        <StepDelivery values={state.delivery} onCommit={commitDelivery} />
      )}

      {state.step === "farmacia" && (
        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold">{t("pharmacy.select")}</h2>
          <ul className="flex flex-col gap-2">
            {pharmacies.map((pharmacyId) => {
              const active = state.pharmacy?.pharmacyId === pharmacyId;
              return (
                <li key={pharmacyId}>
                  <button
                    type="button"
                    onClick={() => selectPharmacyStep(pharmacyId)}
                    aria-pressed={active}
                    className={cn(
                      "flex w-full items-center justify-between gap-4 rounded-md border px-3 py-2 text-sm font-medium transition-colors",
                      active
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-input bg-background text-muted-foreground hover:bg-accent",
                    )}
                  >
                    {pharmacyId}
                  </button>
                </li>
              );
            })}
          </ul>
          <Button
            type="button"
            className="w-full"
            disabled={state.pharmacy === null}
            onClick={submitPharmacyStep}
          >
            {t("checkout.continue")}
          </Button>
        </section>
      )}

      {state.step === "receita" && (
        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold">{t("prescription.title")}</h2>
          <div className="flex flex-col gap-2">
            {PRESCRIPTION_OPTIONS.map((option) => {
              const active = state.prescription?.status === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setPrescriptionStep(option)}
                  aria-pressed={active}
                  className={cn(
                    "rounded-md border px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-input bg-background text-muted-foreground hover:bg-accent",
                  )}
                >
                  {t(option.label)}
                </button>
              );
            })}
          </div>
          <Button
            type="button"
            className="w-full"
            disabled={state.prescription === null}
            onClick={submitPrescriptionStep}
          >
            {t("checkout.continue")}
          </Button>
        </section>
      )}

      {state.step === "pagamento" && (
        <StepPayment
          method={state.payment?.method ?? null}
          onCommit={commitPayment}
        />
      )}

      {state.step === "review" && (
        <StepReview
          state={state}
          items={cartItems}
          subtotal={subtotal}
          submitting={submitting}
          onPlaceOrder={submitOrder}
        />
      )}

      {state.step === "confirmacao" && (
        <StepConfirmation orderId={state.orderId} />
      )}
    </div>
  );
}
