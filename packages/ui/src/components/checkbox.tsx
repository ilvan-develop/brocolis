import { Check } from "lucide-react";
import type * as React from "react";

import { cn } from "../lib/utils";

function Checkbox({ className, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type="checkbox"
      data-slot="checkbox"
      className={cn(
        "border-input h-4 w-4 shrink-0 rounded-sm border shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 checked:bg-primary checked:text-primary-foreground",
        className,
      )}
      {...props}
    />
  );
}

function CheckboxIndicator({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="checkbox-indicator"
      className={cn("flex items-center justify-center", className)}
      {...props}
    >
      <Check className="h-3.5 w-3.5" />
    </span>
  );
}

export { Checkbox, CheckboxIndicator };
