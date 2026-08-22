import { randomBytes } from "node:crypto";

export function nextCuid(): string {
  return `c${randomBytes(12).toString("hex")}`;
}
