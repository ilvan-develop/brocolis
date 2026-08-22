import { cva, type VariantProps } from "class-variance-authority";
import { View, type ViewProps } from "react-native";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-3 py-1",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary",
        secondary: "border-transparent bg-secondary",
        destructive: "border-transparent bg-destructive",
        outline: "border-border bg-transparent",
        success: "border-transparent bg-emerald-500",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

type BadgeProps = ViewProps &
  VariantProps<typeof badgeVariants> & {
    label: string;
  };

function Badge({ variant, label, className, ...props }: BadgeProps) {
  return (
    <View className={cn(badgeVariants({ variant }), className)} {...props}>
      <View className="items-center">
        <View
          className={
            variant === "default"
              ? "text-primary-foreground"
              : variant === "destructive"
                ? "text-destructive-foreground"
                : variant === "secondary"
                  ? "text-secondary-foreground"
                  : "text-foreground"
          }
        >
          <View>{label}</View>
        </View>
      </View>
    </View>
  );
}

export { Badge, badgeVariants };
