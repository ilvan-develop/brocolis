import { describe, expect, it } from "vitest";

import design from "../../design.json";

type TokenLeaf = { $type: string; $value: unknown };
type TokenNode = TokenLeaf | { [key: string]: TokenLeaf };

const REQUIRED_SEMANTIC = [
  "components.button.primary.bg",
  "components.button.primary.hover",
  "components.card.bg",
  "components.input.bg",
  "components.input.focus.border",
] as const;

const VALID_TYPES = new Set([
  "color",
  "dimension",
  "duration",
  "cubicBezier",
  "string",
  "shadow",
]);

function isLeaf(node: TokenNode): node is TokenLeaf {
  return (
    typeof node === "object" &&
    node !== null &&
    "$type" in node &&
    "$value" in node
  );
}

function collectTokens(
  node: TokenNode,
  prefix = "",
  out: Map<string, TokenLeaf> = new Map(),
): Map<string, TokenLeaf> {
  if (isLeaf(node)) {
    out.set(prefix, { $type: node.$type, $value: node.$value });
    return out;
  }
  for (const [key, value] of Object.entries(node)) {
    const path = prefix ? `${prefix}.${key}` : key;
    collectTokens(value, path, out);
  }
  return out;
}

function collectReferences(leaf: TokenLeaf): string[] {
  if (typeof leaf.$value !== "string") {
    return [];
  }
  return leaf.$value.match(/\{([^}]+)\}/g)?.map((r) => r.slice(1, -1)) ?? [];
}

const designNode = design as unknown as TokenNode;
const tokens = collectTokens(designNode);

describe("design.json (W3C DTCG)", () => {
  it("define os domínios de token esperados", () => {
    const domainKeys = Object.keys(design);
    expect(domainKeys).toEqual(
      expect.arrayContaining([
        "color",
        "space",
        "radius",
        "shadow",
        "motion",
        "breakpoint",
        "components",
      ]),
    );
  });

  it("contém uma escala completa de tokens", () => {
    expect(tokens.size).toBeGreaterThan(80);
  });

  it("todo o token é uma folha com $type e $value", () => {
    for (const [, leaf] of tokens) {
      expect(leaf.$type).toBeTypeOf("string");
      expect(leaf.$type.length).toBeGreaterThan(0);
      expect(leaf).toHaveProperty("$value");
    }
  });

  it("usa apenas $type válidos da especificação DTCG", () => {
    for (const [, leaf] of tokens) {
      expect(
        VALID_TYPES.has(leaf.$type),
        `${leaf.$type} não é um tipo DTCG`,
      ).toBe(true);
    }
  });

  it("referências {dominio.token} resolvem para tokens existentes", () => {
    for (const [path, leaf] of tokens) {
      for (const ref of collectReferences(leaf)) {
        expect(
          tokens.has(ref),
          `${path} referencia ${ref} que não existe`,
        ).toBe(true);
      }
    }
  });

  it("expõe os tokens semânticos de componente obrigatórios", () => {
    for (const path of REQUIRED_SEMANTIC) {
      expect(tokens.has(path), `${path} obrigatório`).toBe(true);
    }
  });
});
