import { useQuery } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import {
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { PharmacyCard } from "@/components/PharmacyCard";
import { ProductCard } from "@/components/ProductCard";
import { OfflineBanner } from "@/components/ui/offline-banner";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { t } from "@/lib/t";

const ORG_ID = "00000000-0000-0000-0000-000000000001";

export default function HomeScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isOffline] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["catalog", "home", "AO"],
    queryFn: () => api.catalog.search(ORG_ID, "AO", { page: 1, pageSize: 10 }),
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const featuredPharmacies = data?.offers
    ? Array.from(
        new Map(
          data.offers
            .filter(
              (
                o,
              ): o is typeof o & {
                pharmacy: { id: string; name?: string; verified?: boolean };
              } => Boolean(o.pharmacy?.id),
            )
            .map((o) => [
              o.pharmacy.id,
              {
                id: o.pharmacy.id,
                name: o.pharmacy.name ?? "Farmácia",
                verified: o.pharmacy.verified ?? false,
              },
            ]),
        ).values(),
      ).slice(0, 5)
    : [];

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <OfflineBanner visible={isOffline} />

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

        <TextInput
          className="h-12 rounded-xl border border-input bg-background px-4 pr-10 text-base text-foreground"
          placeholder={t("catalog.search.placeholder")}
          placeholderTextColor="hsl(var(--muted-foreground))"
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
          accessibilityLabel={t("catalog.search.aria")}
        />

        {isLoading && (
          <View className="gap-4">
            <Skeleton className="h-6 w-1/3" />
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

        {featuredPharmacies.length > 0 && (
          <View className="gap-3">
            <Text className="text-base font-semibold text-foreground">
              Farmácias destaque
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {featuredPharmacies.map((pharmacy) => (
                <PharmacyCard key={pharmacy.id} pharmacy={pharmacy} />
              ))}
            </ScrollView>
          </View>
        )}

        {data?.offers && (
          <View className="gap-3">
            <Text className="text-base font-semibold text-foreground">
              Produtos populares
            </Text>
            {data.offers.map((offer) => (
              <ProductCard key={offer.id} offer={offer} />
            ))}
          </View>
        )}

        {data?.offers.length === 0 && !isLoading && (
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
