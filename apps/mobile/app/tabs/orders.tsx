import { formatCurrency } from "@brocolis/formatters";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { api, type Order } from "@/lib/api";
import { t } from "@/lib/t";

const ORG_ID = "00000000-0000-0000-0000-000000000001";

const statusLabels: Record<string, string> = {
  PENDING: "Pendente",
  CONFIRMED: "Confirmado",
  PROCESSING: "Em preparação",
  IN_TRANSIT: "Em trânsito",
  DELIVERED: "Entregue",
  CANCELED: "Cancelado",
};

function OrderCard({ order }: { order: Order }) {
  const router = useRouter();

  return (
    <Pressable
      className="rounded-xl border border-border bg-card p-4 shadow-sm"
      onPress={() => router.push(`/order/${order.id}`)}
    >
      <View className="gap-2">
        <View className="flex-row items-center justify-between">
          <Text className="text-sm font-semibold text-foreground">
            #{order.id.slice(0, 8)}
          </Text>
          <Text
            className={`text-xs font-medium ${
              order.status === "DELIVERED"
                ? "text-emerald-600"
                : order.status === "CANCELED"
                  ? "text-destructive"
                  : "text-primary"
            }`}
          >
            {statusLabels[order.status] ?? order.status}
          </Text>
        </View>

        <Text className="text-sm text-muted-foreground">
          {new Date(order.createdAt).toLocaleDateString("pt-AO")}
        </Text>

        <View className="flex-row items-center justify-between">
          <Text className="text-sm text-muted-foreground">
            {order.items.length} {order.items.length === 1 ? "item" : "itens"}
          </Text>
          <Text className="text-sm font-semibold text-foreground">
            {formatCurrency(
              order.totals.total.amount,
              order.totals.total.currency,
            )}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

export default function OrdersScreen() {
  const router = useRouter();
  const { data, isLoading } = useQuery({
    queryKey: ["orders", "AO"],
    queryFn: () => api.order.list(ORG_ID, "AO"),
  });

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <ScrollView className="flex-1" contentContainerClassName="gap-4 p-4">
        <Text className="text-xl font-bold text-foreground">
          {t("orders.title")}
        </Text>

        {isLoading && (
          <View className="gap-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <View
                key={i}
                className="gap-3 rounded-xl border border-border p-4"
              >
                <Skeleton className="h-5 w-1/2" />
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-4 w-1/4" />
              </View>
            ))}
          </View>
        )}

        {data?.orders && data.orders.length > 0 && (
          <View className="gap-3">
            {data.orders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </View>
        )}

        {data?.orders.length === 0 && (
          <EmptyState
            title={t("orders.empty")}
            actionLabel={t("catalog.title")}
            onAction={() => router.push("/")}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
