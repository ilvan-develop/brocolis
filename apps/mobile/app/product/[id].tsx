import { formatCurrency } from "@brocolis/formatters";
import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { PharmacyBadge } from "@/components/PharmacyBadge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { t } from "@/lib/t";
import { useCartStore } from "@/stores/cart-store";

const ORG_ID = "00000000-0000-0000-0000-000000000001";

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const addItem = useCartStore((s) => s.addItem);

  const { data: offer, isLoading } = useQuery({
    queryKey: ["catalog", "offer", id],
    queryFn: () => api.catalog.search(ORG_ID, "AO", { query: undefined }),
    select: (data) => data.offers.find((o) => o.id === id),
  });

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
        <View className="gap-4 p-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-5 w-1/2" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-20 w-full" />
        </View>
      </SafeAreaView>
    );
  }

  if (!offer) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
        <View className="flex-1 items-center justify-center">
          <Text className="text-sm text-muted-foreground">
            {t("catalog.empty")}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleAddToCart = () => {
    addItem({
      productId: offer.productId,
      pharmacyId: offer.pharmacyId,
      quantity: 1,
      name: offer.product?.name ?? "Produto",
      price: offer.priceMoney.amount,
      currency: offer.priceMoney.currency,
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <ScrollView className="flex-1" contentContainerClassName="gap-4 p-4">
        <Pressable onPress={() => router.back()}>
          <Text className="text-primary text-sm">← Voltar</Text>
        </Pressable>

        <View className="gap-2">
          <Text className="text-2xl font-bold text-foreground">
            {offer.product?.name ?? "Produto"}
          </Text>
          {offer.product?.dosage && (
            <Text className="text-base text-muted-foreground">
              {offer.product.dosage}
              {offer.product.form ? ` · ${offer.product.form}` : ""}
            </Text>
          )}
        </View>

        {offer.pharmacy?.name && (
          <PharmacyBadge
            name={offer.pharmacy.name}
            verified={offer.pharmacy.verified}
          />
        )}

        <View className="gap-1">
          <Text className="text-sm text-muted-foreground">
            {t("product.price")}
          </Text>
          <Text className="text-3xl font-bold text-primary">
            {formatCurrency(offer.priceMoney.amount, offer.priceMoney.currency)}
          </Text>
        </View>

        <View className="flex-row items-center gap-3">
          <View className="flex-1 rounded-xl bg-background p-3">
            <Text className="text-xs text-muted-foreground">
              {t("commerce.stock.available")}
            </Text>
            <Text className="text-lg font-semibold text-foreground">
              {offer.stock} unidades
            </Text>
          </View>
          {offer.prescriptionRequired && (
            <View className="flex-1 rounded-xl bg-amber-50 p-3 dark:bg-amber-900/20">
              <Text className="text-xs text-amber-700 dark:text-amber-400">
                {t("prescription.title")}
              </Text>
              <Text className="text-xs text-amber-600 dark:text-amber-300">
                {t("storefront.prescriptionRequired")}
              </Text>
            </View>
          )}
        </View>

        <View className="gap-2">
          <Button
            label={`${t("common.cart.add")} — ${formatCurrency(offer.priceMoney.amount, offer.priceMoney.currency)}`}
            onPress={handleAddToCart}
          />
          <Button
            label={t("cart.gotoCheckout")}
            variant="outline"
            onPress={() => router.push("/checkout")}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
