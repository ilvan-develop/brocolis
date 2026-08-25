import type * as React from "react";
import { cn } from "../lib/utils";

function ScrollArea({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="scroll-area"
      className={cn("relative overflow-hidden", className)}
      {...props}
    >
      <div
        data-slot="scroll-area-viewport"
        className="h-full w-full rounded-[inherit]"
        style={{ overflow: "auto" }}
      >
        {children}
      </div>
    </div>
  );
}

export { ScrollArea };
