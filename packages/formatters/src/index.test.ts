import { describe, expect, it } from "vitest";
import {
  formatAddress,
  formatCurrency,
  formatDate,
  formatPercentage,
  formatPhone,
} from "./index.js";

describe("formatCurrency", () => {
  it("formata AOA em pt-AO", () => {
    expect(formatCurrency(12500, "AOA")).toBe("12 500 Kz");
  });

  it("formata BRL com separador de centavos", () => {
    expect(formatCurrency(12500.5, "BRL")).toBe("12.500,50 R$");
  });

  it("formata moeda desconhecida com fallback", () => {
    expect(formatCurrency(100, "USD")).toBe("100 USD");
  });
});

describe("formatPhone", () => {
  it("prefixa com o código de país", () => {
    expect(formatPhone("923 000 000", "+244")).toBe("+244 923 000 000");
  });
});

describe("formatDate", () => {
  it("formata em pt-AO (DD/MM/AAAA)", () => {
    expect(formatDate(new Date(2026, 7, 20, 12), "pt-AO")).toBe("20/08/2026");
  });

  it("faz fallback para pt-PT quando o locale não é suportado", () => {
    expect(formatDate(new Date(2026, 7, 20, 12), "xx-XX")).toBe("20/08/2026");
  });

  it("devolve vazio para datas inválidas", () => {
    expect(formatDate("não-e-uma-data")).toBe("");
  });

  it("aceita string ISO", () => {
    expect(formatDate("2026-08-20T12:00:00", "pt-AO")).toMatch(
      /^20\/08\/2026$/,
    );
  });
});

describe("formatPercentage", () => {
  it("mantém as casas decimais pedidas (8,7%)", () => {
    expect(formatPercentage(8.7, { decimals: 1 })).toBe("8,7%");
  });

  it("usa 0 casas por defeito e arredonda", () => {
    expect(formatPercentage(8.7)).toBe("9%");
    expect(formatPercentage(12.3)).toBe("12%");
  });

  it("suporta zeros e valores inteiros", () => {
    expect(formatPercentage(0)).toBe("0%");
    expect(formatPercentage(100)).toBe("100%");
  });
});

describe("formatAddress", () => {
  it("junta as partes com ', '", () => {
    expect(formatAddress("Luanda", "Ingombota", "Rua da Missão", "20")).toBe(
      "Luanda, Ingombota, Rua da Missão, 20",
    );
  });

  it("ignora partes vazias ou nulas", () => {
    expect(formatAddress("Luanda", "", null, undefined, "  Maianga ")).toBe(
      "Luanda, Maianga",
    );
  });

  it("devolve string vazia quando não há partes", () => {
    expect(formatAddress()).toBe("");
  });
});
