import { describe, expect, it } from "vitest";
import { cn } from "./utils.js";

describe("cn", () => {
  it("concatena valores e deixa o último vencer em conflitos", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
  });

  it("ignora falsy", () => {
    expect(cn("a", undefined, "", false, "b")).toBe("a b");
  });
});
