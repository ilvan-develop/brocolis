"use client";

import { t } from "@brocolis/i18n";
import { Input } from "@brocolis/ui/components/input";
import { Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  createDebouncer,
  type Debouncer,
  SEARCH_DEBOUNCE_MS,
} from "@/lib/catalog";

type CatalogSearchProps = {
  onQueryChange: (query: string) => void;
};

export function CatalogSearch({ onQueryChange }: CatalogSearchProps) {
  const [value, setValue] = useState("");
  const debouncerRef = useRef<Debouncer | null>(null);

  useEffect(() => {
    debouncerRef.current = createDebouncer(SEARCH_DEBOUNCE_MS);
    const debouncer = debouncerRef.current;
    return () => {
      debouncer.cancel();
    };
  }, []);

  function handleChange(query: string) {
    setValue(query);
    debouncerRef.current?.schedule(() => onQueryChange(query));
  }

  return (
    <div className="relative">
      <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
      <Input
        type="search"
        value={value}
        onChange={(event) => handleChange(event.target.value)}
        placeholder={t("catalog.search.placeholder")}
        aria-label={t("catalog.search.aria")}
        className="pl-9"
      />
    </div>
  );
}
