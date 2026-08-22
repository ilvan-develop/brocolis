import { formatCurrency } from "@brocolis/formatters";
import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { OrderStatusTimeline } from "@/components/OrderStatusTimeline";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { t } from "@/lib/t";

const ORG_ID = "00000000-0000-0000-0000-000000000001";

export default function OrderTrackingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const { data: order, isLoading } = useQuery({
    queryKey: ["order", id],
    queryFn: () => api.order.get(ORG_ID, "AO", String(id)),
    enabled: !!id,
    refetchInterval: 10000,
  });

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
        <View className="gap-4 p-4">
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-32 w-full" />
        </View>
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
        <View className="flex-1 items-center justify-center">
          <Text className="text-sm text-muted-foreground">
            Pedido não encontrado
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const allStatuses = [
    "PENDING",
    "CONFIRMED",
    "PROCESSING",
    "IN_TRANSIT",
    "DELIVERED",
  ];

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <ScrollView className="flex-1" contentContainerClassName="gap-4 p-4">
        <Text className="text-xl font-bold text-foreground">
          {t("order.title")} #{order.id.slice(0, 8)}
        </Text>

        <View className="rounded-xl border border-border bg-card p-4">
          <Text className="mb-3 text-sm font-medium text-foreground">
            Estado do pedido
          </Text>
          <OrderStatusTimeline
            statuses={allStatuses}
            currentStatus={order.status}
          />
        </View>

        <View className="gap-3 rounded-xl border border-border bg-card p-4">
          <Text className="text-sm font-medium text-foreground">
            {t("checkout.step.review")}
          </Text>
          {order.items.map((item, idx) => (
            <View key={idx} className="flex-row items-center justify-between">
              <Text className="text-sm text-foreground" numberOfLines={1}>
                {item.quantity}x {item.productId.slice(0, 8)}
              </Text>
              <Text className="text-sm text-muted-foreground">
                {formatCurrency(item.lineTotal.amount, item.lineTotal.currency)}
              </Text>
            </View>
          ))}

          <View className="border-t border-border pt-2">
            <View className="flex-row items-center justify-between">
              <Text className="text-sm text-muted-foreground">
                {t("order.vat")}
              </Text>
              <Text className="text-sm text-foreground">
                {formatCurrency(
                  order.totals.vat.amount,
                  order.totals.vat.currency,
                )}
              </Text>
            </View>
            <View className="flex-row items-center justify-between">
              <Text className="text-base font-semibold text-foreground">
                {t("order.total")}
              </Text>
              <Text className="text-lg font-bold text-primary">
                {formatCurrency(
                  order.totals.total.amount,
                  order.totals.total.currency,
                )}
              </Text>
            </View>
          </View>
        </View>

        {order.deliveryAddress && (
          <View className="rounded-xl border border-border bg-card p-4">
            <Text className="text-sm font-medium text-foreground">
              {t("delivery.address.title")}
            </Text>
            <Text className="text-sm text-muted-foreground">
              {order.deliveryAddress.addressLine}
            </Text>
            {order.deliveryAddress.city && (
              <Text className="text-sm text-muted-foreground">
                {order.deliveryAddress.city}
              </Text>
            )}
          </View>
        )}

        <Button
          label={t("orders.confirmation.back")}
          variant="outline"
          onPress={() => router.push("/")}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
