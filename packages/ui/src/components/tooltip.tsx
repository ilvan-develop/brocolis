import type * as React from "react";

import { cn } from "../lib/utils";

function Tooltip({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="tooltip"
      role="tooltip"
      className={cn(
        "bg-foreground text-background z-50 overflow-hidden rounded-md px-3 py-1.5 text-xs font-medium",
        "animate-in fade-in-0 zoom-in-95",
        className,
      )}
      {...props}
    />
  );
}

function TooltipTrigger({
  className,
  ...props
}: React.ComponentProps<"button">) {
  return (
    <button
      data-slot="tooltip-trigger"
      className={cn("", className)}
      {...props}
    />
  );
}

function TooltipContent({
  className,
  sideOffset = 4,
  ...props
}: React.ComponentProps<"div"> & { sideOffset?: number }) {
  return (
    <div
      data-slot="tooltip-content"
      data-side-offset={sideOffset}
      className={cn(
        "bg-foreground text-background z-50 overflow-hidden rounded-md px-3 py-1.5 text-xs font-medium",
        "animate-in fade-in-0 zoom-in-95",
        "data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2",
        "data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        className,
      )}
      {...props}
    />
  );
}

function TooltipProvider({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="tooltip-provider"
      className={cn("", className)}
      {...props}
    />
  );
}

export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger };
