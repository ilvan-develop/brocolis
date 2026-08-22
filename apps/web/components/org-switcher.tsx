"use client";

import { t } from "@brocolis/i18n";
import { cn } from "@brocolis/ui/lib/utils";
import { Check, ChevronsUpDown } from "lucide-react";
import { type KeyboardEvent, useId, useRef, useState } from "react";

export type OrgOption = {
  id: string;
  name: string;
};

type OrgSwitcherProps = {
  organizations: readonly OrgOption[];
  activeId: string | null;
  onSwitch: (organizationId: string) => void;
  disabled?: boolean;
  label?: string;
};

export function OrgSwitcher({
  organizations,
  activeId,
  onSwitch,
  disabled = false,
  label = t("org.switcher.label"),
}: OrgSwitcherProps) {
  const [open, setOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(0);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const listId = useId();

  const activeIndex = Math.max(
    0,
    organizations.findIndex((org) => org.id === activeId),
  );

  function openMenu() {
    setHighlightIndex(activeIndex);
    setOpen(true);
  }

  function closeMenu() {
    setOpen(false);
    buttonRef.current?.focus();
  }

  function choose(org: OrgOption) {
    onSwitch(org.id);
    closeMenu();
  }

  function focusOption(index: number) {
    const option = optionRefs.current[index];
    if (option) {
      option.focus();
    }
  }

  function handleButtonKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (disabled) {
      return;
    }

    switch (event.key) {
      case "Enter":
      case " ":
        event.preventDefault();
        if (open) {
          const org = organizations[highlightIndex];
          if (org) {
            choose(org);
          }
        } else {
          openMenu();
          focusOption(activeIndex);
        }
        break;
      case "ArrowDown":
      case "ArrowUp":
        event.preventDefault();
        if (!open) {
          openMenu();
        }
        focusOption(highlightIndex);
        break;
      case "Escape":
        if (open) {
          event.stopPropagation();
          closeMenu();
        }
        break;
    }
  }

  function handleListKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (!open) {
      return;
    }

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        setHighlightIndex((current) => {
          const next = Math.min(current + 1, organizations.length - 1);
          focusOption(next);
          return next;
        });
        break;
      case "ArrowUp":
        event.preventDefault();
        setHighlightIndex((current) => {
          const next = Math.max(current - 1, 0);
          focusOption(next);
          return next;
        });
        break;
      case "Home":
        event.preventDefault();
        setHighlightIndex(0);
        focusOption(0);
        break;
      case "End":
        event.preventDefault();
        setHighlightIndex(organizations.length - 1);
        focusOption(organizations.length - 1);
        break;
      case "Escape":
        event.preventDefault();
        closeMenu();
        break;
      case "Tab":
        closeMenu();
        break;
    }
  }

  return (
    <div className="relative inline-block text-left">
      <button
        ref={buttonRef}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => {
          if (open) {
            closeMenu();
          } else {
            openMenu();
            focusOption(activeIndex);
          }
        }}
        onKeyDown={handleButtonKeyDown}
        className="bg-background hover:bg-accent text-foreground border-input inline-flex h-9 items-center justify-between gap-2 rounded-md border px-3 text-sm font-medium shadow-xs outline-none focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50"
      >
        {organizations.find((org) => org.id === activeId)?.name ?? label}
        <ChevronsUpDown aria-hidden className="size-4 opacity-60" />
      </button>

      {open && (
        <div
          id={listId}
          role="listbox"
          aria-label={label}
          onKeyDown={handleListKeyDown}
          className="bg-popover text-popover-foreground absolute top-full left-0 z-50 mt-1 w-64 rounded-md border p-1 shadow-md"
        >
          {organizations.map((org, index) => {
            const isActive = org.id === activeId;
            return (
              <button
                key={org.id}
                ref={(node) => {
                  optionRefs.current[index] = node;
                }}
                type="button"
                role="option"
                aria-selected={isActive}
                data-highlighted={index === highlightIndex}
                onClick={() => choose(org)}
                className={cn(
                  "focus-visible:ring-ring/50 flex w-full items-center justify-between gap-2 rounded-sm px-2 py-1.5 text-sm outline-none focus-visible:ring-[3px]",
                  isActive && "font-medium",
                  index === highlightIndex && "bg-accent",
                )}
              >
                <span>{org.name}</span>
                {isActive && (
                  <span className="text-primary flex items-center gap-1 text-xs">
                    {t("org.switcher.active")}
                    <Check aria-hidden className="size-3.5" />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
