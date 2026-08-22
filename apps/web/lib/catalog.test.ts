import { afterEach, describe, expect, it, vi } from "vitest";
import {
  categoryKeyFor,
  categoryLabel,
  createDebouncer,
  filterCatalogRows,
  matchesQuery,
  normalizeText,
  SEARCH_DEBOUNCE_MS,
} from "./catalog";

function row(
  overrides: Partial<{ name: string; brand: string; categoryId: string }> = {},
) {
  return {
    productId: "c1234567890abcdefghijkl",
    name: overrides.name ?? "Paracetamol 500mg",
    brand: overrides.brand ?? "LabAngola",
    categoryId: overrides.categoryId ?? "c00000000000000000000001",
  };
}

describe("catalog — normalização de texto", () => {
  it("remove acentos e passa a minúsculas", () => {
    expect(normalizeText("Água Benta  Cão")).toBe("agua benta cao");
  });

  it("normaliza strings vazias e espaços", () => {
    expect(normalizeText("   ")).toBe("");
    expect(normalizeText("Paracetamol")).toBe("paracetamol");
  });

  it("SEARCH_DEBOUNCE_MS é 350ms", () => {
    expect(SEARCH_DEBOUNCE_MS).toBe(350);
  });
});

describe("catalog — matchesQuery", () => {
  it("casa por fragmento contido", () => {
    expect(
      matchesQuery(["Paracetamol 500mg", "LabAngola"], "pAraCetaMOL"),
    ).toBe(true);
  });

  it("casa ignorando acentos na busca", () => {
    expect(matchesQuery(["Ácido Fólico"], "acido")).toBe(true);
  });

  it("não casa quando nada coincide", () => {
    expect(matchesQuery(["Paracetamol"], "ibuprofeno")).toBe(false);
  });

  it("query vazia casa sempre", () => {
    expect(matchesQuery(["qualquer"], "")).toBe(true);
    expect(matchesQuery([], "   ")).toBe(true);
  });
});

describe("catalog — filterCatalogRows", () => {
  const catalog = [
    row({
      name: "Paracetamol 500mg",
      brand: "LabAngola",
      categoryId: "c00000000000000000000001",
    }),
    row({
      name: "Amoxicilina 500mg",
      brand: "MedPharma",
      categoryId: "c00000000000000000000002",
    }),
    row({
      name: "Vitamina C",
      brand: "NutriAO",
      categoryId: "c00000000000000000000003",
    }),
  ];

  it("sem filtros devolve tudo", () => {
    expect(
      filterCatalogRows(catalog, { query: "", categoryId: null }),
    ).toHaveLength(3);
  });

  it("filtra por termo no nome ou marca", () => {
    const result = filterCatalogRows(catalog, {
      query: "med",
      categoryId: null,
    });
    expect(result.map((item) => item.name)).toEqual(["Amoxicilina 500mg"]);
  });

  it("filtra por categoria", () => {
    const result = filterCatalogRows(catalog, {
      query: "",
      categoryId: "c00000000000000000000003",
    });
    expect(result.map((item) => item.name)).toEqual(["Vitamina C"]);
  });

  it("combina categoria e pesquisa (cruzamentos vazios)", () => {
    const result = filterCatalogRows(catalog, {
      query: "vitamina",
      categoryId: "c00000000000000000000001",
    });
    expect(result).toHaveLength(0);
  });
});

describe("catalog — categorias via i18n", () => {
  it("mapeia slugs conhecidos para chaves", () => {
    expect(categoryKeyFor("dor-e-febre")).toBe("category.pain");
    expect(categoryKeyFor("vitaminas")).toBe("category.vitamins");
  });

  it("slug desconhecido cai em category.other", () => {
    expect(categoryKeyFor("cirurgia")).toBe("category.other");
    expect(categoryKeyFor(undefined)).toBe("category.other");
    expect(categoryKeyFor(null)).toBe("category.other");
  });

  it("categoryLabel usa a tradução pt-AO", () => {
    expect(categoryLabel({ slug: "dor-e-febre" })).toBe("Dor e febre");
    expect(categoryLabel({ slug: "vitaminas" })).toBe(
      "Vitaminas e suplementos",
    );
  });

  it("categoryLabel respeita o locale en-KE", () => {
    expect(categoryLabel({ slug: "dor-e-febre", locale: "en-KE" })).toBe(
      "Pain and fever",
    );
  });

  it("categoryLabel usa o nome fornecido como fallback", () => {
    expect(categoryLabel({ slug: "cardiologia", name: "Cardiologia" })).toBe(
      "Cardiologia",
    );
    expect(categoryLabel({ slug: null, name: null })).toBe("Outros");
  });
});

describe("catalog — debounce", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("agrupa chamadas rápidas numa só execução", () => {
    vi.useFakeTimers();
    const debouncer = createDebouncer(100);
    const callback = vi.fn();

    debouncer.schedule(callback);
    debouncer.schedule(callback);
    debouncer.schedule(callback);

    expect(callback).not.toHaveBeenCalled();
    vi.advanceTimersByTime(100);
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it("cancel impede a execução pendente", () => {
    vi.useFakeTimers();
    const debouncer = createDebouncer(100);
    const callback = vi.fn();

    debouncer.schedule(callback);
    debouncer.cancel();
    vi.advanceTimersByTime(200);

    expect(callback).not.toHaveBeenCalled();
  });

  it("nova agenda recomeça o temporizador", () => {
    vi.useFakeTimers();
    const debouncer = createDebouncer(100);
    const callback = vi.fn();

    debouncer.schedule(callback);
    vi.advanceTimersByTime(60);
    debouncer.schedule(callback);
    vi.advanceTimersByTime(60);

    expect(callback).not.toHaveBeenCalled();
    vi.advanceTimersByTime(40);
    expect(callback).toHaveBeenCalledTimes(1);
  });
});
