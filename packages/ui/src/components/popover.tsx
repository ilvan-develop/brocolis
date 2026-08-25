import type * as React from "react";

import { cn } from "../lib/utils";

function Popover({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="popover" className={cn("", className)} {...props} />;
}

function PopoverTrigger({
  className,
  ...props
}: React.ComponentProps<"button">) {
  return (
    <button
      data-slot="popover-trigger"
      className={cn("", className)}
      {...props}
    />
  );
}

function PopoverContent({
  className,
  align = "center",
  sideOffset = 4,
  ...props
}: React.ComponentProps<"div"> & {
  align?: "start" | "center" | "end";
  sideOffset?: number;
}) {
  return (
    <div
      data-slot="popover-content"
      data-align={align}
      data-side-offset={sideOffset}
      className={cn(
        "bg-popover text-popover-foreground z-50 w-72 rounded-md border shadow-md",
        "data-[state=open]:animate-in data-[state=closed]:animate-out",
        "data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2",
        "data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        className,
      )}
      {...props}
    />
  );
}

function PopoverAnchor({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div data-slot="popover-anchor" className={cn("", className)} {...props} />
  );
}

export { Popover, PopoverAnchor, PopoverContent, PopoverTrigger };
