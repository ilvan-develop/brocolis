import { formatCurrency } from "@brocolis/formatters";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CartSummary } from "@/components/CartSummary";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { t } from "@/lib/t";
import { useCartStore } from "@/stores/cart-store";

export default function CartScreen() {
  const router = useRouter();
  const { items, updateQuantity, removeItem, total, itemCount } =
    useCartStore();
  const currency = "AOA";

  if (items.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
        <EmptyState
          title={t("cart.empty")}
          actionLabel={t("cart.continueShopping")}
          onAction={() => router.back()}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <ScrollView className="flex-1" contentContainerClassName="gap-4 p-4">
        <View className="flex-row items-center gap-2">
          <Pressable onPress={() => router.back()}>
            <Text className="text-primary text-sm">←</Text>
          </Pressable>
          <Text className="text-xl font-bold text-foreground">
            {t("cart.title")} ({itemCount()})
          </Text>
        </View>

        <View className="gap-3">
          {items.map((item) => (
            <View
              key={`${item.productId}-${item.pharmacyId}`}
              className="flex-row items-center gap-3 rounded-xl border border-border bg-card p-4"
            >
              <View className="flex-1 gap-1">
                <Text
                  className="text-sm font-semibold text-foreground"
                  numberOfLines={1}
                >
                  {item.name}
                </Text>
                <Text className="text-sm text-muted-foreground">
                  {formatCurrency(item.price, item.currency)}
                </Text>
              </View>

              <View className="flex-row items-center gap-2">
                <Pressable
                  className="h-8 w-8 items-center justify-center rounded-lg border border-border"
                  onPress={() =>
                    updateQuantity(
                      item.productId,
                      item.pharmacyId,
                      item.quantity - 1,
                    )
                  }
                  accessibilityLabel={t("cart.quantity")}
                >
                  <Text className="text-lg">-</Text>
                </Pressable>
                <Text className="w-6 text-center text-sm font-medium text-foreground">
                  {item.quantity}
                </Text>
                <Pressable
                  className="h-8 w-8 items-center justify-center rounded-lg border border-border"
                  onPress={() =>
                    updateQuantity(
                      item.productId,
                      item.pharmacyId,
                      item.quantity + 1,
                    )
                  }
                >
                  <Text className="text-lg">+</Text>
                </Pressable>
              </View>

              <Pressable
                className="h-8 w-8 items-center justify-center"
                onPress={() => removeItem(item.productId, item.pharmacyId)}
                accessibilityLabel={t("cart.remove")}
              >
                <Text className="text-destructive">✕</Text>
              </Pressable>
            </View>
          ))}
        </View>

        <CartSummary
          subtotal={total()}
          currency={currency}
          itemCount={itemCount()}
        />

        <Button
          label={t("cart.gotoCheckout")}
          onPress={() => router.push("/checkout")}
        />

        <Button
          label={t("cart.continueShopping")}
          variant="ghost"
          onPress={() => router.back()}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
