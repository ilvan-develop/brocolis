import { useQuery } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { RefreshControl, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ProductCard } from "@/components/ProductCard";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { t } from "@/lib/t";

const ORG_ID = "00000000-0000-0000-0000-000000000001";

export default function HomeScreen() {
  const [refreshing, setRefreshing] = useState(false);

  const { data, isLoading, refetch, error } = useQuery({
    queryKey: ["catalog", "home", "AO"],
    queryFn: () => api.catalog.search(ORG_ID, "AO", { page: 1, pageSize: 10 }),
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-4 p-4"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View className="gap-1">
          <Text className="text-2xl font-bold text-foreground">
            {t("catalog.title")}
          </Text>
          <Text className="text-sm text-muted-foreground">
            {t("catalog.subtitle")}
          </Text>
        </View>

        {isLoading && (
          <View className="gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <View
                key={i}
                className="gap-3 rounded-xl border border-border p-4"
              >
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-8 w-1/3" />
              </View>
            ))}
          </View>
        )}

        {error && (
          <View className="items-center gap-2 py-8">
            <Text className="text-sm text-destructive">
              {t("catalog.error")}
            </Text>
            <Text className="text-sm text-primary" onPress={() => refetch()}>
              {t("catalog.retry")}
            </Text>
          </View>
        )}

        {data?.offers && (
          <View className="gap-3">
            {data.offers.map((offer) => (
              <ProductCard key={offer.id} offer={offer} />
            ))}
          </View>
        )}

        {data?.offers.length === 0 && (
          <View className="items-center py-16">
            <Text className="text-sm text-muted-foreground">
              {t("catalog.empty")}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
