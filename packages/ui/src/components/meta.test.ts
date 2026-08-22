import { describe, expect, it } from "vitest";

import { meta as badgeMeta } from "./badge.meta.js";
import { meta as buttonMeta } from "./button.meta.js";
import { meta as cardMeta } from "./card.meta.js";
import { meta as dialogMeta } from "./dialog.meta.js";
import { meta as inputMeta } from "./input.meta.js";
import { meta as labelMeta } from "./label.meta.js";
import { meta as separatorMeta } from "./separator.meta.js";
import { meta as skeletonMeta } from "./skeleton.meta.js";
import { meta as tabsMeta } from "./tabs.meta.js";

const metas = [
  ["button", buttonMeta],
  ["badge", badgeMeta],
  ["card", cardMeta],
  ["input", inputMeta],
  ["label", labelMeta],
  ["separator", separatorMeta],
  ["skeleton", skeletonMeta],
  ["tabs", tabsMeta],
  ["dialog", dialogMeta],
] as const;

const MODELS = ["b2c", "b2b", "b2b2c"] as const;

describe.each(metas)("meta.ts — %s (4 pilares)", (_name, meta) => {
  it("define category não vazio", () => {
    expect(meta.category).toBeTypeOf("string");
    expect(meta.category.length).toBeGreaterThan(0);
  });

  it("declara os 3 modelos de negócio", () => {
    expect(meta.models).toEqual(expect.arrayContaining([...MODELS]));
  });

  it("define purpose não vazio", () => {
    expect(meta.purpose).toBeTypeOf("string");
    expect(meta.purpose.length).toBeGreaterThan(0);
  });

  it("define variantes e props", () => {
    expect(meta.variants).toBeInstanceOf(Array);
    expect(meta.props).toBeTypeOf("object");
  });

  it("mapeia tokens e anti-patterns", () => {
    expect(meta.tokens).toBeTypeOf("object");
    expect(meta.antiPatterns).toBeInstanceOf(Array);
    expect(meta.antiPatterns.length).toBeGreaterThan(0);
  });

  it("define regras de acessibilidade", () => {
    expect(meta.accessibility).toBeTypeOf("object");
    expect(Object.keys(meta.accessibility).length).toBeGreaterThan(0);
  });
});
