import { expect, test } from "vitest";
import { appName } from "./app-name";

test("appName retorna a marca Brócolis", () => {
  expect(appName()).toBe("Brócolis");
});
