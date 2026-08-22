import { type Locale, type MessageKey, t } from "@brocolis/i18n";

export type CatalogFilter = {
  query: string;
  categoryId: string | null;
};

export type CatalogFilterable = {
  productId: string;
  name: string;
  brand: string;
  categoryId: string | null;
};

export const SEARCH_DEBOUNCE_MS = 350;

const CATEGORY_KEYS: Record<string, MessageKey> = {
  "dor-e-febre": "category.pain",
  respiratorio: "category.respiratory",
  digestivo: "category.digestive",
  dermatologia: "category.dermatology",
  vitaminas: "category.vitamins",
  "primeiros-socorros": "category.firstaid",
};

export function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export function matchesQuery(
  haystack: readonly string[],
  query: string,
): boolean {
  const normalizedQuery = normalizeText(query);
  if (normalizedQuery.length === 0) {
    return true;
  }
  return haystack.some((part) => normalizeText(part).includes(normalizedQuery));
}

export function filterCatalogRows(
  rows: readonly CatalogFilterable[],
  filter: CatalogFilter,
): CatalogFilterable[] {
  const query = normalizeText(filter.query);
  return rows.filter((row) => {
    const matchesCategory =
      filter.categoryId === null || row.categoryId === filter.categoryId;
    const matchesSearch = matchesQuery([row.name, row.brand], query);
    return matchesCategory && matchesSearch;
  });
}

export function categoryKeyFor(slug: string | null | undefined): MessageKey {
  if (slug !== null && slug !== undefined) {
    const key = CATEGORY_KEYS[slug];
    if (key !== undefined) {
      return key;
    }
  }
  return "category.other";
}

export function categoryLabel(input: {
  slug?: string | null;
  name?: string | null;
  locale?: Locale;
}): string {
  if (input.slug !== null && input.slug !== undefined) {
    const key = CATEGORY_KEYS[input.slug];
    if (key !== undefined) {
      return t(key, input.locale);
    }
  }
  const name = input.name?.trim();
  if (name !== undefined && name !== null && name.length > 0) {
    return name;
  }
  return t("category.other", input.locale);
}

export type Debouncer = {
  schedule: (callback: () => void) => void;
  cancel: () => void;
};

export function createDebouncer(delayMs: number): Debouncer {
  let timer: ReturnType<typeof setTimeout> | null = null;

  return {
    schedule(callback) {
      if (timer !== null) {
        clearTimeout(timer);
      }
      timer = setTimeout(callback, delayMs);
    },
    cancel() {
      if (timer !== null) {
        clearTimeout(timer);
        timer = null;
      }
    },
  };
}
