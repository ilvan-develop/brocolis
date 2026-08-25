import type { ComponentPropsWithoutRef } from "react";

import { cn } from "../lib/utils";

type SelectProps = ComponentPropsWithoutRef<"select"> & {
  value?: string;
  onValueChange?: (value: string) => void;
};

function Select({ className, value, onValueChange, ...props }: SelectProps) {
  return (
    <select
      data-slot="select"
      value={value}
      onChange={(event) => onValueChange?.(event.target.value)}
      className={cn(
        "border-input bg-background text-foreground flex h-9 w-full items-center justify-between rounded-md border px-3 py-2 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 [&>option]:bg-background [&>option]:text-foreground",
        className,
      )}
      {...props}
    />
  );
}

type SelectTriggerProps = ComponentPropsWithoutRef<"button">;

function SelectTrigger({ className, ...props }: SelectTriggerProps) {
  return (
    <button
      data-slot="select-trigger"
      className={cn(
        "border-input bg-background text-foreground flex h-9 w-full items-center justify-between rounded-md border px-3 py-2 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

type SelectValueProps = ComponentPropsWithoutRef<"span"> & {
  placeholder?: string;
};

function SelectValue({ className, placeholder, ...props }: SelectValueProps) {
  return (
    <span
      data-slot="select-value"
      className={cn("text-foreground", className)}
      {...props}
    >
      {placeholder}
    </span>
  );
}

type SelectContentProps = ComponentPropsWithoutRef<"div">;

function SelectContent({ className, ...props }: SelectContentProps) {
  return (
    <div
      data-slot="select-content"
      className={cn(
        "bg-popover text-popover-foreground z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border shadow-md",
        "data-[state=open]:animate-in data-[state=closed]:animate-out",
        "data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2",
        "data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        className,
      )}
      {...props}
    />
  );
}

type SelectItemProps = ComponentPropsWithoutRef<"div"> & {
  value: string;
};

function SelectItem({ className, value, ...props }: SelectItemProps) {
  return (
    <div
      data-slot="select-item"
      data-value={value}
      className={cn(
        "text-foreground relative flex w-full cursor-default items-center rounded-sm py-1.5 pr-8 pl-2 text-sm transition-colors focus-visible:outline-none focus-visible:bg-accent focus-visible:text-accent-foreground disabled:pointer-events-none disabled:opacity-50",
        "[&_svg]:absolute [&_svg]:right-2 [&_svg]:size-4 [&_svg]:shrink-0",
        "data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground",
        className,
      )}
      {...props}
    />
  );
}

export { Select, SelectContent, SelectItem, SelectTrigger, SelectValue };
