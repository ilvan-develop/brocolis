import { useMutation } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CartSummary } from "@/components/CartSummary";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { enqueueOrder, isNetworkError } from "@/lib/order-queue";
import { t } from "@/lib/t";
import { useCartStore } from "@/stores/cart-store";

const ORG_ID = "00000000-0000-0000-0000-000000000001";

type CheckoutStep = "client" | "delivery" | "payment" | "review";

export default function CheckoutScreen() {
  const router = useRouter();
  const { items, total, clearCart } = useCartStore();
  const [step, setStep] = useState<CheckoutStep>("client");
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [addressLine, setAddressLine] = useState("");
  const [city, setCity] = useState("");
  const [referencePoint, setReferencePoint] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<string>("COD");
  const [queuedOffline, setQueuedOffline] = useState(false);

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
    onError: async (error) => {
      if (!isNetworkError(error)) return;
      await enqueueOrder({
        organizationId: ORG_ID,
        marketCode: "AO",
        items: items.map((i) => ({
          productId: i.productId,
          pharmacyId: i.pharmacyId,
          quantity: i.quantity,
        })),
        deliveryAddress: { zone: "urban", addressLine, city, referencePoint },
      });
      clearCart();
      setQueuedOffline(true);
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
              <Input
                label={t("checkout.client.name")}
                placeholder={t("checkout.client.name")}
                value={clientName}
                onChangeText={setClientName}
                autoCapitalize="words"
              />
              <Input
                label={t("checkout.client.phone")}
                placeholder={t("checkout.client.phone")}
                value={clientPhone}
                onChangeText={setClientPhone}
                keyboardType="phone-pad"
              />
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
              <Input
                label={t("delivery.address.street")}
                placeholder={t("delivery.address.street")}
                value={addressLine}
                onChangeText={setAddressLine}
              />
              <Input
                label={t("delivery.address.city")}
                placeholder={t("delivery.address.city")}
                value={city}
                onChangeText={setCity}
              />
              <Input
                label={t("delivery.address.referencePoint")}
                placeholder={t("delivery.address.referencePoint")}
                value={referencePoint}
                onChangeText={setReferencePoint}
              />
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
                  <Pressable
                    key={method}
                    onPress={() => setPaymentMethod(method)}
                    accessibilityRole="radio"
                    accessibilityState={{
                      selected: paymentMethod === method,
                    }}
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
                  </Pressable>
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

            {queuedOffline ? (
              <>
                <Text className="text-sm font-medium text-primary">
                  {t("orders.confirmation.description")}
                </Text>
                <Button
                  label={t("orders.confirmation.back")}
                  onPress={() => router.push("/")}
                />
              </>
            ) : (
              <>
                <Button
                  label={
                    createOrder.isPending ? "..." : t("checkout.placeOrder")
                  }
                  onPress={() => createOrder.mutate()}
                  disabled={createOrder.isPending}
                />

                {createOrder.isError && (
                  <Text className="text-sm text-destructive">
                    {t("error.generic")}
                  </Text>
                )}
              </>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
