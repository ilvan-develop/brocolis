import { Text, TextInput, type TextInputProps, View } from "react-native";
import { cn } from "@/lib/utils";

type InputProps = TextInputProps & {
  label?: string;
  error?: string;
};

export function Input({ label, error, className, ...props }: InputProps) {
  return (
    <View className="gap-1.5">
      {label && (
        <Text className="text-sm font-medium text-foreground">{label}</Text>
      )}
      <TextInput
        className={cn(
          "h-12 rounded-xl border bg-background px-4 text-base text-foreground",
          error ? "border-destructive" : "border-input",
          "focus:border-primary",
          className,
        )}
        placeholderTextColor="hsl(var(--muted-foreground))"
        accessibilityLabel={label}
        {...props}
      />
      {error && <Text className="text-xs text-destructive">{error}</Text>}
    </View>
  );
}
