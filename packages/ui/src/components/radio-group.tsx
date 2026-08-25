import type * as React from "react";

import { cn } from "../lib/utils";

function RadioGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="radio-group"
      role="radiogroup"
      className={cn("grid gap-2", className)}
      {...props}
    />
  );
}

function RadioGroupItem({
  className,
  ...props
}: React.ComponentProps<"input">) {
  return (
    <input
      type="radio"
      data-slot="radio-group-item"
      className={cn(
        "border-input text-primary h-4 w-4 rounded-full border shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export { RadioGroup, RadioGroupItem };
