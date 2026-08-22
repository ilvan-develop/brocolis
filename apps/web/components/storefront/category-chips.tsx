"use client";

import { t } from "@brocolis/i18n";
import { cn } from "@brocolis/ui";
import type { CategoryChip } from "@/lib/catalog-mapper";

type CategoryChipsProps = {
  categories: readonly CategoryChip[];
  selected: string | null;
  onSelect: (categoryId: string | null) => void;
};

export function CategoryChips({
  categories,
  selected,
  onSelect,
}: CategoryChipsProps) {
  const items: { id: string | null; label: string }[] = [
    { id: null, label: t("category.all") },
    ...categories.map((chip) => ({ id: chip.id, label: chip.name })),
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => {
        const active = selected === item.id;
        return (
          <button
            key={item.id ?? "all"}
            type="button"
            onClick={() => onSelect(item.id)}
            aria-pressed={active}
            className={cn(
              "rounded-full border px-3 py-1 text-sm font-medium transition-colors",
              active
                ? "border-primary bg-primary text-primary-foreground"
                : "border-input bg-background text-muted-foreground hover:bg-accent",
            )}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
