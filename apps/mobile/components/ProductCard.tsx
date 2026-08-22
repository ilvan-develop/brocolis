import { formatCurrency } from "@brocolis/formatters";
import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";
import type { MarketOffer } from "@/lib/api";
import { t } from "@/lib/t";
import { cn } from "@/lib/utils";

type ProductCardProps = {
  offer: MarketOffer;
  className?: string;
};

export function ProductCard({ offer, className }: ProductCardProps) {
  const router = useRouter();

  const productName = offer.product?.name ?? "Produto";
  const price = offer.priceMoney.amount;
  const currency = offer.priceMoney.currency;
  const inStock = offer.stock > 0;

  return (
    <Pressable
      className={cn(
        "rounded-xl border border-border bg-card p-4 shadow-sm active:opacity-80",
        className,
      )}
      onPress={() => router.push(`/product/${offer.id}`)}
      accessibilityLabel={`${productName}, ${formatCurrency(price, currency)}`}
      accessibilityRole="button"
    >
      <View className="gap-2">
        <View className="flex-row items-start justify-between gap-2">
          <Text
            className="flex-1 text-base font-semibold text-foreground"
            numberOfLines={2}
          >
            {productName}
          </Text>
          {offer.prescriptionRequired && (
            <View className="rounded-full bg-amber-100 px-2 py-0.5 dark:bg-amber-900/30">
              <Text className="text-xs text-amber-700 dark:text-amber-400">
                Rx
              </Text>
            </View>
          )}
        </View>

        {offer.product?.dosage && (
          <Text className="text-sm text-muted-foreground">
            {offer.product.dosage}
            {offer.product.form ? ` · ${offer.product.form}` : ""}
          </Text>
        )}

        {offer.pharmacy?.name && (
          <View className="flex-row items-center gap-1.5">
            <Text className="text-xs text-muted-foreground" numberOfLines={1}>
              {offer.pharmacy.name}
            </Text>
            {offer.pharmacy.verified && (
              <Text className="text-xs text-primary">✓</Text>
            )}
          </View>
        )}

        <View className="flex-row items-end justify-between gap-2">
          <View>
            <Text className="text-xs text-muted-foreground">
              {t("product.lowestPrice")}
            </Text>
            <Text className="text-lg font-bold text-primary">
              {formatCurrency(price, currency)}
            </Text>
          </View>

          {inStock ? (
            <View className="rounded-lg bg-primary px-3 py-1.5">
              <Text className="text-xs font-semibold text-primary-foreground">
                {t("common.cart.add")}
              </Text>
            </View>
          ) : (
            <Text className="text-xs text-destructive">
              {t("commerce.stock.out")}
            </Text>
          )}
        </View>
      </View>
    </Pressable>
  );
}
