"use client";

import type * as React from "react";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

import { cn } from "../lib/utils";

type TabsContextValue = {
  value: string;
  setValue: (value: string) => void;
};

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabsContext() {
  const ctx = useContext(TabsContext);
  if (!ctx) {
    throw new Error("Tabs* components must be used within <Tabs>");
  }
  return ctx;
}

type TabsProps = React.ComponentProps<"div"> & {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
};

function Tabs({
  defaultValue = "",
  value,
  onValueChange,
  className,
  children,
  ...props
}: TabsProps) {
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue);
  const activeValue = value ?? uncontrolledValue;

  const setValue = useCallback(
    (next: string) => {
      if (value === undefined) {
        setUncontrolledValue(next);
      }
      onValueChange?.(next);
    },
    [value, onValueChange],
  );

  const contextValue = useMemo(
    () => ({ value: activeValue, setValue }),
    [activeValue, setValue],
  );

  return (
    <TabsContext.Provider value={contextValue}>
      <div
        data-slot="tabs"
        className={cn("flex flex-col gap-2", className)}
        {...props}
      >
        {children}
      </div>
    </TabsContext.Provider>
  );
}

function TabsList({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      role="tablist"
      data-slot="tabs-list"
      className={cn(
        "bg-muted text-muted-foreground inline-flex h-9 w-fit items-center justify-center rounded-lg p-[3px]",
        className,
      )}
      {...props}
    />
  );
}

type TabsTriggerProps = React.ComponentProps<"button"> & {
  value: string;
};

function TabsTrigger({ value, className, ...props }: TabsTriggerProps) {
  const { value: activeValue, setValue } = useTabsContext();
  const selected = activeValue === value;

  return (
    <button
      type="button"
      role="tab"
      aria-selected={selected}
      data-slot="tabs-trigger"
      data-state={selected ? "active" : "inactive"}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-[color,box-shadow] focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        selected && "bg-background text-foreground shadow-sm",
        className,
      )}
      onClick={() => setValue(value)}
      {...props}
    />
  );
}

type TabsContentProps = React.ComponentProps<"div"> & {
  value: string;
};

function TabsContent({ value, className, ...props }: TabsContentProps) {
  const { value: activeValue } = useTabsContext();
  const selected = activeValue === value;

  if (!selected) {
    return null;
  }

  return (
    <div
      role="tabpanel"
      data-slot="tabs-content"
      data-state={selected ? "active" : "inactive"}
      className={cn("flex-1 outline-none", className)}
      {...props}
    />
  );
}

export { Tabs, TabsContent, TabsList, TabsTrigger };
