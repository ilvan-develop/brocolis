import { useMutation } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CartSummary } from "@/components/CartSummary";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { t } from "@/lib/t";
import { useCartStore } from "@/stores/cart-store";

const ORG_ID = "00000000-0000-0000-0000-000000000001";

type CheckoutStep = "client" | "delivery" | "payment" | "review";

export default function CheckoutScreen() {
  const router = useRouter();
  const { items, total, clearCart } = useCartStore();
  const [step, setStep] = useState<CheckoutStep>("client");
  const [clientName, _setClientName] = useState("");
  const [clientPhone, _setClientPhone] = useState("");
  const [addressLine, _setAddressLine] = useState("");
  const [city, _setCity] = useState("");
  const [referencePoint, _setReferencePoint] = useState("");
  const [paymentMethod, _setPaymentMethod] = useState<string>("COD");

  const createOrder = useMutation({
    mutationFn: () =>
      api.order.create(ORG_ID, "AO", {
        items: items.map((i) => ({
          productId: i.productId,
          pharmacyId: i.pharmacyId,
          quantity: i.quantity,
        })),
        deliveryAddress: {
          zone: "urban",
          addressLine,
          city,
          referencePoint,
        },
      }),
    onSuccess: (order) => {
      clearCart();
      router.push(`/payment/${order.id}`);
    },
  });

  const steps: CheckoutStep[] = ["client", "delivery", "payment", "review"];
  const currentIdx = steps.indexOf(step);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <ScrollView className="flex-1" contentContainerClassName="gap-4 p-4">
        <View className="flex-row items-center gap-2">
          {currentIdx > 0 && (
            <Button
              label="←"
              variant="ghost"
              size="icon"
              onPress={() => setStep(steps[currentIdx - 1])}
            />
          )}
          <Text className="text-xl font-bold text-foreground">
            {t("checkout.title")}
          </Text>
        </View>

        <View className="flex-row gap-1">
          {steps.map((s, i) => (
            <View
              key={s}
              className={`h-1 flex-1 rounded-full ${
                i <= currentIdx ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </View>

        {step === "client" && (
          <View className="gap-4">
            <Text className="text-sm font-medium text-foreground">
              {t("checkout.client.title")}
            </Text>
            <View className="gap-3">
              <View className="gap-1.5">
                <Text className="text-sm font-medium text-foreground">
                  {t("checkout.client.name")}
                </Text>
                <View className="h-12 rounded-xl border border-input bg-background px-4">
                  <Text
                    className="h-full justify-center text-base text-foreground"
                    numberOfLines={1}
                  >
                    {clientName || t("checkout.client.name")}
                  </Text>
                </View>
              </View>
              <View className="gap-1.5">
                <Text className="text-sm font-medium text-foreground">
                  {t("checkout.client.phone")}
                </Text>
                <View className="h-12 rounded-xl border border-input bg-background px-4">
                  <Text
                    className="h-full justify-center text-base text-foreground"
                    numberOfLines={1}
                  >
                    {clientPhone || t("checkout.client.phone")}
                  </Text>
                </View>
              </View>
            </View>
            <Button
              label={t("checkout.continue")}
              onPress={() => setStep("delivery")}
              disabled={!clientName || !clientPhone}
            />
          </View>
        )}

        {step === "delivery" && (
          <View className="gap-4">
            <Text className="text-sm font-medium text-foreground">
              {t("delivery.address.title")}
            </Text>
            <View className="gap-3">
              <View className="gap-1.5">
                <Text className="text-sm font-medium text-foreground">
                  {t("delivery.address.street")}
                </Text>
                <View className="h-12 rounded-xl border border-input bg-background px-4">
                  <Text
                    className="h-full justify-center text-base text-foreground"
                    numberOfLines={1}
                  >
                    {addressLine || t("delivery.address.street")}
                  </Text>
                </View>
              </View>
              <View className="gap-1.5">
                <Text className="text-sm font-medium text-foreground">
                  {t("delivery.address.city")}
                </Text>
                <View className="h-12 rounded-xl border border-input bg-background px-4">
                  <Text
                    className="h-full justify-center text-base text-foreground"
                    numberOfLines={1}
                  >
                    {city || t("delivery.address.city")}
                  </Text>
                </View>
              </View>
              <View className="gap-1.5">
                <Text className="text-sm font-medium text-foreground">
                  {t("delivery.address.referencePoint")}
                </Text>
                <View className="h-12 rounded-xl border border-input bg-background px-4">
                  <Text
                    className="h-full justify-center text-base text-foreground"
                    numberOfLines={1}
                  >
                    {referencePoint || t("delivery.address.referencePoint")}
                  </Text>
                </View>
              </View>
            </View>
            <Button
              label={t("checkout.continue")}
              onPress={() => setStep("payment")}
              disabled={!addressLine}
            />
          </View>
        )}

        {step === "payment" && (
          <View className="gap-4">
            <Text className="text-sm font-medium text-foreground">
              {t("payment.title")}
            </Text>
            <View className="gap-2">
              {(["COD", "REFERENCE", "CARD", "MOBILE"] as const).map(
                (method) => (
                  <View
                    key={method}
                    className={`rounded-xl border p-4 ${
                      paymentMethod === method
                        ? "border-primary bg-primary/10"
                        : "border-border"
                    }`}
                  >
                    <Text
                      className={`text-sm font-medium ${
                        paymentMethod === method
                          ? "text-primary"
                          : "text-foreground"
                      }`}
                    >
                      {method === "COD"
                        ? t("payment.method.cod")
                        : method === "REFERENCE"
                          ? t("payment.method.reference")
                          : method === "CARD"
                            ? t("payment.method.card")
                            : t("payment.method.mobile")}
                    </Text>
                  </View>
                ),
              )}
            </View>
            <Button
              label={t("checkout.continue")}
              onPress={() => setStep("review")}
            />
          </View>
        )}

        {step === "review" && (
          <View className="gap-4">
            <Text className="text-sm font-medium text-foreground">
              {t("checkout.step.review")}
            </Text>

            <View className="gap-2 rounded-xl border border-border p-4">
              <Text className="text-sm font-medium text-foreground">
                {clientName}
              </Text>
              <Text className="text-sm text-muted-foreground">
                {clientPhone}
              </Text>
              <Text className="text-sm text-muted-foreground">
                {addressLine}
              </Text>
              {city && (
                <Text className="text-sm text-muted-foreground">{city}</Text>
              )}
            </View>

            <CartSummary
              subtotal={total()}
              currency="AOA"
              itemCount={items.length}
            />

            <Button
              label={createOrder.isPending ? "..." : t("checkout.placeOrder")}
              onPress={() => createOrder.mutate()}
              disabled={createOrder.isPending}
            />

            {createOrder.isError && (
              <Text className="text-sm text-destructive">
                {t("error.generic")}
              </Text>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
