import { Text, View } from "react-native";
import { cn } from "@/lib/utils";

type OrderTimelineStep = {
  status: string;
  label: string;
  timestamp?: string;
};

type OrderTimelineProps = {
  steps: OrderTimelineStep[];
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

export function OrderTimeline({
  steps,
  currentStatus,
  className,
}: OrderTimelineProps) {
  const currentIdx = statusOrder.indexOf(currentStatus);

  const matchingSteps = statusOrder
    .map((status) => {
      const step = steps.find((s) => s.status === status);
      return step ?? { status, label: status, timestamp: undefined };
    })
    .filter(
      (s) =>
        statusOrder.indexOf(s.status) <= currentIdx || s.status === "CANCELED",
    );

  return (
    <View className={cn("gap-0", className)}>
      {matchingSteps.map((step, idx) => {
        const isLast = idx === matchingSteps.length - 1;
        const isCurrent = step.status === currentStatus;

        return (
          <View key={step.status} className="flex-row gap-3">
            <View className="items-center">
              <View
                className={cn(
                  "h-3 w-3 rounded-full",
                  isCurrent
                    ? "border-2 border-primary bg-background"
                    : "bg-primary",
                )}
              />
              {!isLast && <View className="h-6 w-px bg-border" />}
            </View>
            <View className="flex-1 pb-4">
              <Text
                className={cn(
                  "text-sm font-medium",
                  isCurrent ? "text-primary" : "text-foreground",
                )}
              >
                {step.label}
              </Text>
              {step.timestamp && (
                <Text className="text-xs text-muted-foreground">
                  {new Date(step.timestamp).toLocaleString("pt-AO")}
                </Text>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}
