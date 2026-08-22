import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { t } from "@/lib/t";

const ORG_ID = "00000000-0000-0000-0000-000000000001";

const _statusConfig: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  PENDING: {
    label: "Pagamento pendente",
    color: "text-amber-700",
    bg: "bg-amber-50 dark:bg-amber-900/20",
  },
  CONFIRMED: {
    label: "Pagamento confirmado",
    color: "text-emerald-700",
    bg: "bg-emerald-50 dark:bg-emerald-900/20",
  },
  FAILED: {
    label: "Pagamento falhou",
    color: "text-destructive",
    bg: "bg-destructive/10",
  },
  REFUNDED: {
    label: "Reembolsado",
    color: "text-muted-foreground",
    bg: "bg-muted",
  },
};

export default function PaymentStatusScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const router = useRouter();

  const { data: order, isLoading } = useQuery({
    queryKey: ["order", orderId],
    queryFn: () => api.order.get(ORG_ID, "AO", String(orderId)),
    enabled: !!orderId,
    refetchInterval: 5000,
  });

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
        <View className="gap-4 p-4">
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="h-24 w-full" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <ScrollView
        className="flex-1"
        contentContainerClassName="items-center gap-6 p-4"
      >
        <Text className="text-xl font-bold text-foreground">
          {t("payment.title")}
        </Text>

        <View className="w-full items-center gap-4 rounded-xl border border-border bg-card p-8">
          <View className="h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Text className="text-3xl">💳</Text>
          </View>

          <Text className="text-center text-lg font-semibold text-foreground">
            {t("orders.confirmation.title")}
          </Text>
          <Text className="text-center text-sm text-muted-foreground">
            {t("orders.confirmation.description")}
          </Text>

          {order?.id && (
            <View className="rounded-lg bg-muted p-3">
              <Text className="text-xs text-muted-foreground">
                {t("orders.reference")}
              </Text>
              <Text className="text-sm font-mono font-semibold text-foreground">
                {order.id.slice(0, 12)}
              </Text>
            </View>
          )}
        </View>

        <Button
          label={t("orders.confirmation.back")}
          variant="outline"
          onPress={() => router.push("/")}
        />

        <Button
          label={t("orders.track")}
          onPress={() => router.push(`/order/${orderId}`)}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
