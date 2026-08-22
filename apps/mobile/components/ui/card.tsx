import { View, type ViewProps } from "react-native";
import { cn } from "@/lib/utils";

function Card({ className, ...props }: ViewProps) {
  return (
    <View
      className={cn(
        "rounded-xl border border-border bg-card p-4 shadow-sm",
        className,
      )}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: ViewProps) {
  return <View className={cn("flex-col gap-1.5", className)} {...props} />;
}

function CardTitle({
  className,
  children,
  ...props
}: ViewProps & { children?: React.ReactNode }) {
  return (
    <View className={cn("flex-row items-center gap-2", className)} {...props}>
      {children !== undefined && <View className="flex-1">{children}</View>}
    </View>
  );
}

function CardDescription({
  className,
  children,
  ...props
}: ViewProps & { children?: React.ReactNode }) {
  return (
    <View {...props}>
      {typeof children === "string" ? (
        <View className="flex-row">
          <View className="text-muted-foreground text-sm">{children}</View>
        </View>
      ) : (
        children
      )}
    </View>
  );
}

function CardContent({ className, ...props }: ViewProps) {
  return <View className={cn("gap-4", className)} {...props} />;
}

function CardFooter({ className, ...props }: ViewProps) {
  return (
    <View className={cn("flex-row items-center gap-3", className)} {...props} />
  );
}

export {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
};
