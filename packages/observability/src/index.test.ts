import { describe, expect, it, vi } from "vitest";
import { createLogger } from "./index.js";

describe("createLogger", () => {
  it("loga info por defeito", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    const logger = createLogger("info");
    logger.info("ola");
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('"level":"info"'));
    spy.mockRestore();
  });

  it("suprime debug quando o nível é info", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    const logger = createLogger("info");
    logger.debug("nao deve aparecer");
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });
});
