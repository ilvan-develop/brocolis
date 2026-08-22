import { Pressable, Text, View } from "react-native";
import { t } from "@/lib/t";
import { cn } from "@/lib/utils";

type PharmacyCardProps = {
  pharmacy: {
    id: string;
    name: string;
    verified: boolean;
  };
  className?: string;
};

export function PharmacyCard({ pharmacy, className }: PharmacyCardProps) {
  return (
    <Pressable
      className={cn(
        "mr-3 w-36 shrink-0 rounded-xl border border-border bg-card p-3 shadow-sm active:opacity-80",
        className,
      )}
      accessibilityLabel={`${pharmacy.name}, ${pharmacy.verified ? t("pharmacy.verified") : ""}`}
      accessibilityRole="button"
    >
      <View className="gap-2">
        <Text
          className="text-sm font-semibold text-foreground"
          numberOfLines={2}
        >
          {pharmacy.name}
        </Text>
        {pharmacy.verified && (
          <View className="flex-row items-center gap-1">
            <View className="h-1.5 w-1.5 rounded-full bg-primary" />
            <Text className="text-xs text-primary">
              {t("pharmacy.verified")}
            </Text>
          </View>
        )}
        <Text className="text-xs text-muted-foreground">
          {t("pharmacy.deliveryFee")}
        </Text>
      </View>
    </Pressable>
  );
}
