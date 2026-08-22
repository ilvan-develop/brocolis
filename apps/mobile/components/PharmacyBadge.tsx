import { Text, View } from "react-native";
import { cn } from "@/lib/utils";

type PharmacyBadgeProps = {
  name: string;
  verified: boolean;
  className?: string;
};

export function PharmacyBadge({
  name,
  verified,
  className,
}: PharmacyBadgeProps) {
  return (
    <View className={cn("flex-row items-center gap-1.5", className)}>
      <Text className="text-sm text-foreground" numberOfLines={1}>
        {name}
      </Text>
      {verified && (
        <View className="rounded-full bg-primary/10 px-1.5 py-0.5">
          <Text className="text-xs font-medium text-primary">✓ Verificada</Text>
        </View>
      )}
    </View>
  );
}
