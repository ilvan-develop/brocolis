import type * as React from "react";

import { cn } from "../lib/utils";

function Sheet({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet"
      className={cn(
        "fixed inset-0 z-50 flex data-[state=open]:animate-in data-[state=closed]:animate-out",
        className,
      )}
      {...props}
    />
  );
}

function SheetTrigger({ className, ...props }: React.ComponentProps<"button">) {
  return (
    <button
      data-slot="sheet-trigger"
      className={cn("", className)}
      {...props}
    />
  );
}

function SheetClose({ className, ...props }: React.ComponentProps<"button">) {
  return (
    <button data-slot="sheet-close" className={cn("", className)} {...props} />
  );
}

function SheetPortal({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div data-slot="sheet-portal" className={cn("", className)} {...props} />
  );
}

function SheetOverlay({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-overlay"
      className={cn(
        "fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out",
        className,
      )}
      {...props}
    />
  );
}

function SheetContent({
  className,
  side = "right",
  ...props
}: React.ComponentProps<"div"> & {
  side?: "top" | "right" | "bottom" | "left";
}) {
  return (
    <SheetPortal>
      <SheetOverlay />
      <div
        data-slot="sheet-content"
        data-side={side}
        className={cn(
          "bg-background z-50 gap-4 p-4 shadow-lg transition ease-in-out",
          "fixed inset-y-0 h-full w-3/4 max-w-sm",
          side === "right" &&
            "right-0 border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right",
          side === "left" &&
            "left-0 border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left",
          side === "top" &&
            "top-0 border-b data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top",
          side === "bottom" &&
            "bottom-0 border-t data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
          className,
        )}
        {...props}
      />
    </SheetPortal>
  );
}

function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-header"
      className={cn("flex flex-col gap-1.5", className)}
      {...props}
    />
  );
}

function SheetFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-footer"
      className={cn(
        "mt-auto flex flex-col-reverse sm:flex-row sm:justify-end sm:gap-2",
        className,
      )}
      {...props}
    />
  );
}

function SheetTitle({ className, ...props }: React.ComponentProps<"h2">) {
  return (
    <h2
      data-slot="sheet-title"
      className={cn("text-foreground text-lg font-semibold", className)}
      {...props}
    />
  );
}

function SheetDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="sheet-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  );
}

export {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetOverlay,
  SheetPortal,
  SheetTitle,
  SheetTrigger,
};
