import { SESSION_IDLE_TIMEOUT_MINUTES, type SessionInfo } from "@brocolis/auth";

export interface SessionStore {
  get(token: string): SessionInfo | undefined;
  set(token: string, info: SessionInfo): void;
  delete(token: string): void;
  size(): number;
}

export type SessionStoreOptions = {
  idleTimeoutMinutes?: number;
  now?: () => number;
};

type SessionEntry = {
  info: SessionInfo;
  lastAccess: number;
};

/**
 * Store de sessões em memória — idle timeout 30min (14-THREAT-MODEL §2.1).
 * Substituído por Prisma/Redis em fases posteriores.
 */
export class InMemorySessionStore implements SessionStore {
  private readonly sessions = new Map<string, SessionEntry>();
  private readonly idleTimeoutMs: number;
  private readonly now: () => number;

  constructor(options: SessionStoreOptions = {}) {
    const idleTimeoutMinutes =
      options.idleTimeoutMinutes ?? SESSION_IDLE_TIMEOUT_MINUTES;
    this.idleTimeoutMs = idleTimeoutMinutes * 60_000;
    this.now = options.now ?? Date.now;
  }

  get(token: string): SessionInfo | undefined {
    const entry = this.sessions.get(token);
    if (!entry) {
      return undefined;
    }
    if (this.now() - entry.lastAccess >= this.idleTimeoutMs) {
      this.sessions.delete(token);
      return undefined;
    }
    entry.lastAccess = this.now();
    return entry.info;
  }

  set(token: string, info: SessionInfo): void {
    this.sessions.set(token, { info, lastAccess: this.now() });
  }

  delete(token: string): void {
    this.sessions.delete(token);
  }

  size(): number {
    return this.sessions.size;
  }
}
