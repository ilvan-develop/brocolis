import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ProductCard } from "@/components/ProductCard";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { t } from "@/lib/t";

const ORG_ID = "00000000-0000-0000-0000-000000000001";

export default function SearchScreen() {
  const [query, setQuery] = useState("");

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["catalog", "search", query],
    queryFn: () =>
      api.catalog.search(ORG_ID, "AO", {
        query: query || undefined,
        page: 1,
        pageSize: 20,
      }),
    enabled: true,
  });

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <View className="gap-4 p-4">
        <Text className="text-xl font-bold text-foreground">
          {t("catalog.search.placeholder")}
        </Text>
        <TextInput
          className="h-12 rounded-xl border border-input bg-background px-4 text-base text-foreground"
          placeholder={t("catalog.search.placeholder")}
          placeholderTextColor="hsl(var(--muted-foreground))"
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={() => refetch()}
          returnKeyType="search"
          accessibilityLabel={t("catalog.search.aria")}
        />
      </View>

      <ScrollView className="flex-1" contentContainerClassName="gap-3 p-4 pt-0">
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

        {data?.offers && (
          <View className="gap-3">
            {data.offers.map((offer) => (
              <ProductCard key={offer.id} offer={offer} />
            ))}
          </View>
        )}

        {data?.offers.length === 0 && query.length > 0 && (
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
