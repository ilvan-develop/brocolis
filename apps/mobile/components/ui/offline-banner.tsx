import { Text, View } from "react-native";
import { cn } from "@/lib/utils";

type OfflineBannerProps = {
  visible: boolean;
  className?: string;
};

export function OfflineBanner({ visible, className }: OfflineBannerProps) {
  if (!visible) return null;

  return (
    <View
      className={cn("items-center bg-destructive py-2", className)}
      role="alert"
    >
      <Text className="text-xs font-medium text-destructive-foreground">
        Sem conexão
      </Text>
    </View>
  );
}
