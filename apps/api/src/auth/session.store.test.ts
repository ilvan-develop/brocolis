import type { SessionInfo } from "@brocolis/auth";
import { describe, expect, it } from "vitest";
import { InMemorySessionStore } from "./session.store.js";

const info: SessionInfo = {
  userId: "u1",
  organizationId: "org-1",
  marketCode: "AO",
  portal: "PHARMACY",
  roles: ["OWNER"],
};

function tickingClock() {
  let t = 0;
  return {
    now: () => t,
    advance(ms: number): void {
      t += ms;
    },
  };
}

describe("InMemorySessionStore", () => {
  it("armazena e recupera uma sessão", () => {
    const store = new InMemorySessionStore();
    store.set("token1", info);
    expect(store.get("token1")).toEqual(info);
    expect(store.size()).toBe(1);
  });

  it("expira sessão inativa após o idle timeout (30min por defeito)", () => {
    const clock = tickingClock();
    const store = new InMemorySessionStore({
      idleTimeoutMinutes: 30,
      now: clock.now,
    });
    store.set("t1", info);
    clock.advance(30 * 60 * 1000);
    expect(store.get("t1")).toBeUndefined();
    expect(store.size()).toBe(0);
  });

  it("renova lastAccess na leitura (sliding idle)", () => {
    const clock = tickingClock();
    const store = new InMemorySessionStore({
      idleTimeoutMinutes: 30,
      now: clock.now,
    });
    store.set("t1", info);
    clock.advance(29 * 60 * 1000);
    expect(store.get("t1")).toEqual(info);
    clock.advance(29 * 60 * 1000);
    expect(store.get("t1")).toEqual(info);
  });

  it("mantém sessões viva antes do timeout", () => {
    const clock = tickingClock();
    const store = new InMemorySessionStore({
      idleTimeoutMinutes: 30,
      now: clock.now,
    });
    store.set("t1", info);
    clock.advance(29 * 60 * 1000);
    expect(store.get("t1")).toEqual(info);
  });

  it("permite revogação de sessão", () => {
    const store = new InMemorySessionStore();
    store.set("t1", info);
    store.delete("t1");
    expect(store.get("t1")).toBeUndefined();
    expect(store.size()).toBe(0);
  });

  it("usa 30min por defeito sem configuração", () => {
    const store = new InMemorySessionStore();
    store.set("t1", info);
    expect(store.size()).toBe(1);
  });
});
