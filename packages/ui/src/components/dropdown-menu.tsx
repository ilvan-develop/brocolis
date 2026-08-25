import { Slot } from "@radix-ui/react-slot";
import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";
import type * as React from "react";

import { cn } from "../lib/utils";

const dropdownMenuItemVariants = cva(
  "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors focus-visible:outline-none focus-visible:bg-accent focus-visible:text-accent-foreground disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "",
        destructive:
          "text-destructive focus-visible:bg-destructive/10 focus-visible:text-destructive",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

type DropdownMenuItemProps = React.ComponentProps<"a"> &
  VariantProps<typeof dropdownMenuItemVariants> & {
    inset?: boolean;
  };

function DropdownMenuItem({
  className,
  inset,
  variant = "default",
  ...props
}: DropdownMenuItemProps) {
  return (
    <a
      data-slot="dropdown-menu-item"
      data-inset={inset}
      data-variant={variant}
      className={cn(
        dropdownMenuItemVariants({ variant }),
        inset && "pl-8",
        className,
      )}
      {...props}
    />
  );
}

function DropdownMenuSeparator({
  className,
  ...props
}: React.ComponentProps<"hr">) {
  return (
    <hr
      data-slot="dropdown-menu-separator"
      className={cn("bg-border -mx-1 my-1 h-px w-full border-0", className)}
      {...props}
    />
  );
}

function DropdownMenuLabel({
  className,
  inset,
  ...props
}: React.ComponentProps<"div"> & { inset?: boolean }) {
  return (
    <div
      data-slot="dropdown-menu-label"
      data-inset={inset}
      className={cn(
        "text-muted-foreground px-2 py-1.5 text-xs font-medium",
        inset && "pl-8",
        className,
      )}
      {...props}
    />
  );
}

function DropdownMenuShortcut({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="dropdown-menu-shortcut"
      className={cn(
        "text-muted-foreground ml-auto text-xs tracking-widest",
        className,
      )}
      {...props}
    />
  );
}

function DropdownMenuGroup({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dropdown-menu-group"
      className={cn("", className)}
      {...props}
    />
  );
}

function DropdownMenuRadioGroup({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dropdown-menu-radio-group"
      className={cn("", className)}
      {...props}
    />
  );
}

function DropdownMenuRadioItem({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dropdown-menu-radio-item"
      className={cn(
        "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors focus-visible:outline-none focus-visible:bg-accent focus-visible:text-accent-foreground disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0",
        className,
      )}
      {...props}
    />
  );
}

function DropdownMenuCheckboxItem({
  className,
  children,
  checked,
  ...props
}: React.ComponentProps<"div"> & {
  checked?: boolean;
}) {
  return (
    <div
      data-slot="dropdown-menu-checkbox-item"
      data-checked={checked}
      className={cn(
        "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors focus-visible:outline-none focus-visible:bg-accent focus-visible:text-accent-foreground disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0",
        checked && "bg-accent text-accent-foreground",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

type DropdownMenuContentProps = React.ComponentProps<"div"> & {
  sideOffset?: number;
  align?: "start" | "center" | "end";
};

function DropdownMenuContent({
  className,
  sideOffset = 4,
  align = "center",
  ...props
}: DropdownMenuContentProps) {
  return (
    <div
      data-slot="dropdown-menu-content"
      data-side-offset={sideOffset}
      data-align={align}
      className={cn(
        "bg-popover text-popover-foreground z-50 min-w-[8rem] rounded-md border shadow-md",
        "data-[state=open]:animate-in data-[state=closed]:animate-out",
        "data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2",
        "data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        className,
      )}
      {...props}
    />
  );
}

type DropdownMenuTriggerProps = React.ComponentProps<"button"> & {
  asChild?: boolean;
};

function DropdownMenuTrigger({
  asChild = false,
  className,
  ...props
}: DropdownMenuTriggerProps) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="dropdown-menu-trigger"
      className={cn("", className)}
      {...props}
    />
  );
}

function DropdownMenuPortal({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dropdown-menu-portal"
      className={cn("", className)}
      {...props}
    />
  );
}

function DropdownMenuSub({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dropdown-menu-sub"
      className={cn("", className)}
      {...props}
    />
  );
}

function DropdownMenuSubTrigger({
  className,
  inset,
  ...props
}: React.ComponentProps<"div"> & { inset?: boolean }) {
  return (
    <div
      data-slot="dropdown-menu-sub-trigger"
      data-inset={inset}
      className={cn(
        "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors focus-visible:outline-none focus-visible:bg-accent focus-visible:text-accent-foreground disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0",
        inset && "pl-8",
        className,
      )}
      {...props}
    />
  );
}

function DropdownMenuSubContent({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dropdown-menu-sub-content"
      className={cn(
        "bg-popover text-popover-foreground z-50 min-w-[8rem] rounded-md border shadow-md",
        "data-[state=open]:animate-in data-[state=closed]:animate-out",
        "data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2",
        "data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        className,
      )}
      {...props}
    />
  );
}

function DropdownMenu({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dropdown-menu"
      className={cn("relative inline-block", className)}
      {...props}
    />
  );
}

export {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
};
