import { describe, expect, it } from "vitest";
import { HealthController } from "./health.controller.js";

describe("HealthController", () => {
  it("reporta status ok", () => {
    const controller = new HealthController();
    const result = controller.check();
    expect(result.status).toBe("ok");
    expect(result.service).toBe("brocolis-api");
  });
});
