import {
  createPasswordHash,
  createSessionToken,
  type PortalCode,
  type SessionInfo,
  verifyPassword,
} from "@brocolis/auth";
import { Injectable, Optional, UnauthorizedException } from "@nestjs/common";
import { InMemorySessionStore, type SessionStore } from "./session.store.js";

export type StoredUser = {
  userId: string;
  email: string;
  name: string;
  passwordHash: string;
  organizationId: string;
  marketCode: string;
  portal: PortalCode;
  roles: string[];
};

export type RegisterUserInput = {
  userId: string;
  email: string;
  name: string;
  password: string;
  organizationId: string;
  marketCode: string;
  portal: PortalCode;
  roles: string[];
};

export type IssueSessionResult = {
  token: string;
  expiresAt: Date;
};

export const SESSION_TTL_MINUTES = 60 * 24;

/**
 * Serviço de autenticação F1 — validators puros na memória até ao wiring
 * Prisma/Redis. `validateCredentials` usa `verifyPassword` (scrypt, timing-safe).
 */
@Injectable()
export class AuthService {
  private readonly users = new Map<string, StoredUser>();
  readonly sessions: SessionStore;

  constructor(@Optional() sessions?: SessionStore) {
    this.sessions = sessions ?? new InMemorySessionStore();
  }

  registerUser(input: RegisterUserInput): StoredUser {
    const user: StoredUser = {
      userId: input.userId,
      email: input.email,
      name: input.name,
      passwordHash: createPasswordHash(input.password),
      organizationId: input.organizationId,
      marketCode: input.marketCode,
      portal: input.portal,
      roles: input.roles,
    };
    this.users.set(user.userId, user);
    return user;
  }

  async validateCredentials(
    email: string,
    password: string,
  ): Promise<StoredUser> {
    const user = [...this.users.values()].find((u) => u.email === email);
    if (!user || !verifyPassword(password, user.passwordHash)) {
      throw new UnauthorizedException("Credenciais inválidas");
    }
    return user;
  }

  async issueSession(userId: string): Promise<IssueSessionResult> {
    const user = this.users.get(userId);
    if (!user) {
      throw new UnauthorizedException("Utilizador desconhecido");
    }
    const token = createSessionToken();
    const expiresAt = new Date(Date.now() + SESSION_TTL_MINUTES * 60_000);
    const info: SessionInfo = {
      userId: user.userId,
      organizationId: user.organizationId,
      marketCode: user.marketCode,
      portal: user.portal,
      roles: user.roles,
    };
    this.sessions.set(token, info);
    return { token, expiresAt };
  }

  requireSession(token: string): SessionInfo {
    const info = this.sessions.get(token);
    if (!info) {
      throw new UnauthorizedException("Sessão inválida ou expirada");
    }
    return info;
  }

  revokeSession(token: string): void {
    this.sessions.delete(token);
  }
}
