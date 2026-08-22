import { Text, View } from "react-native";
import { cn } from "@/lib/utils";

type OrderStatusTimelineProps = {
  statuses: string[];
  currentStatus: string;
  className?: string;
};

const statusOrder = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "IN_TRANSIT",
  "DELIVERED",
];

const statusLabels: Record<string, string> = {
  PENDING: "Pendente",
  CONFIRMED: "Confirmado",
  PROCESSING: "Em preparação",
  IN_TRANSIT: "Em trânsito",
  DELIVERED: "Entregue",
  CANCELED: "Cancelado",
};

export function OrderStatusTimeline({
  statuses: _statuses,
  currentStatus,
  className,
}: OrderStatusTimelineProps) {
  const currentIdx = statusOrder.indexOf(currentStatus);

  return (
    <View className={cn("gap-2", className)}>
      {statusOrder.map((status, idx) => {
        const isPast = idx < currentIdx;
        const isCurrent = status === currentStatus;

        return (
          <View key={status} className="flex-row items-center gap-3">
            <View
              className={cn(
                "h-3 w-3 rounded-full",
                isPast && "bg-primary",
                isCurrent && "border-2 border-primary bg-background",
                !isPast && !isCurrent && "bg-muted",
              )}
            />
            <Text
              className={cn(
                "text-sm",
                isCurrent && "font-semibold text-primary",
                !isCurrent && "text-muted-foreground",
              )}
            >
              {statusLabels[status]}
            </Text>
          </View>
        );
      })}

      {currentStatus === "CANCELED" && (
        <View className="flex-row items-center gap-3">
          <View className="h-3 w-3 rounded-full bg-destructive" />
          <Text className="text-sm font-semibold text-destructive">
            Cancelado
          </Text>
        </View>
      )}
    </View>
  );
}
