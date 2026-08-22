import { cva, type VariantProps } from "class-variance-authority";
import { Pressable, type PressableProps, Text } from "react-native";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "flex-row items-center justify-center gap-2 rounded-xl active:opacity-80 disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary",
        destructive: "bg-destructive",
        outline: "border border-border bg-transparent",
        secondary: "bg-secondary",
        ghost: "bg-transparent",
        link: "bg-transparent",
      },
      size: {
        default: "h-12 px-6 py-3",
        sm: "h-10 px-4 py-2",
        lg: "h-14 px-8 py-4",
        icon: "h-12 w-12 items-center justify-center",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

const buttonTextVariants = cva("text-sm font-semibold", {
  variants: {
    variant: {
      default: "text-primary-foreground",
      destructive: "text-destructive-foreground",
      outline: "text-foreground",
      secondary: "text-secondary-foreground",
      ghost: "text-foreground",
      link: "text-primary underline",
    },
    size: {
      default: "text-base",
      sm: "text-sm",
      lg: "text-lg",
      icon: "text-base",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "default",
  },
});

type ButtonProps = PressableProps &
  VariantProps<typeof buttonVariants> & {
    label: string;
  };

export function Button({
  variant,
  size,
  label,
  className,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <Pressable
      className={cn(buttonVariants({ variant, size, className }))}
      disabled={disabled ?? undefined}
      role="button"
      accessibilityState={{ disabled: disabled ?? undefined }}
      {...props}
    >
      <Text className={buttonTextVariants({ variant, size })}>{label}</Text>
    </Pressable>
  );
}
