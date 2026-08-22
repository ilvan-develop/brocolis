import { describe, expect, it } from "vitest";
import { getDatabase, getDatabaseUrl } from "./index.js";

describe("db proxy", () => {
  it("exige DATABASE_URL", () => {
    expect(() => getDatabaseUrl({})).toThrow(/DATABASE_URL/);
  });

  it("bloqueia acesso não inicializado", () => {
    expect(() => getDatabase()).toThrow(/ainda não inicializada/);
  });
});
