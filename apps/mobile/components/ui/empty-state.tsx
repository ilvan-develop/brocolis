import { Pressable, Text, View, type ViewProps } from "react-native";
import { cn } from "@/lib/utils";

type EmptyStateProps = ViewProps & {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <View
      className={cn(
        "flex-1 items-center justify-center gap-4 px-8 py-16",
        className,
      )}
      {...props}
    >
      <Text className="text-center text-lg font-semibold text-foreground">
        {title}
      </Text>
      {description && (
        <Text className="text-center text-sm text-muted-foreground">
          {description}
        </Text>
      )}
      {actionLabel && onAction && (
        <Pressable
          className="rounded-xl bg-primary px-6 py-3 active:opacity-80"
          onPress={onAction}
        >
          <Text className="text-sm font-semibold text-primary-foreground">
            {actionLabel}
          </Text>
        </Pressable>
      )}
    </View>
  );
}
