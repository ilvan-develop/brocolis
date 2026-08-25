import type * as React from "react";

import { cn } from "../lib/utils";

function Switch({ className, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type="checkbox"
      data-slot="switch"
      className={cn(
        "peer h-5 w-9 shrink-0 cursor-pointer rounded-full border border-transparent shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 checked:bg-primary",
        className,
      )}
      {...props}
    />
  );
}

export { Switch };
