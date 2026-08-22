import { formatCurrency } from "@brocolis/formatters";
import { Text, View } from "react-native";
import { cn } from "@/lib/utils";

type CartSummaryProps = {
  subtotal: number;
  currency: string;
  itemCount: number;
  deliveryFee?: number;
  vat?: number;
  total?: number;
  className?: string;
};

export function CartSummary({
  subtotal,
  currency,
  itemCount,
  deliveryFee,
  vat,
  total,
  className,
}: CartSummaryProps) {
  const format = (amount: number) => formatCurrency(amount, currency);

  return (
    <View
      className={cn(
        "gap-3 rounded-xl border border-border bg-card p-4",
        className,
      )}
    >
      <View className="flex-row items-center justify-between">
        <Text className="text-sm text-muted-foreground">
          Subtotal ({itemCount} {itemCount === 1 ? "item" : "itens"})
        </Text>
        <Text className="text-sm font-medium text-foreground">
          {format(subtotal)}
        </Text>
      </View>

      {deliveryFee !== undefined && (
        <View className="flex-row items-center justify-between">
          <Text className="text-sm text-muted-foreground">Entrega</Text>
          <Text className="text-sm text-foreground">{format(deliveryFee)}</Text>
        </View>
      )}

      {vat !== undefined && (
        <View className="flex-row items-center justify-between">
          <Text className="text-sm text-muted-foreground">IVA (14%)</Text>
          <Text className="text-sm text-foreground">{format(vat)}</Text>
        </View>
      )}

      <View className="border-t border-border pt-3">
        <View className="flex-row items-center justify-between">
          <Text className="text-base font-semibold text-foreground">Total</Text>
          <Text className="text-lg font-bold text-primary">
            {format(total ?? subtotal)}
          </Text>
        </View>
      </View>
    </View>
  );
}
