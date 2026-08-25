import {
  createPasswordHash,
  createSessionToken,
  type PortalCode,
  type SessionInfo,
  verifyPassword,
} from "@brocolis/auth";
import { Injectable, Optional, UnauthorizedException } from "@nestjs/common";
import { PrismaClient } from "@brocolis/db/src/generated/prisma/client.js";
import { PrismaSessionStore } from "./prisma-session.store.js";

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

@Injectable()
export class AuthService {
  private readonly prisma: PrismaClient;
  private readonly jwtSecret: string;

  constructor(
    @Optional() private readonly sessionStore?: PrismaSessionStore,
    jwtSecret?: string,
  ) {
    this.prisma = new PrismaClient();
    this.jwtSecret =
      jwtSecret ?? process.env.JWT_SECRET ?? "change-me-in-production";
    this.sessionStore = sessionStore ?? new PrismaSessionStore(this.prisma);
  }

  async registerUser(input: RegisterUserInput): Promise<StoredUser> {
    const passwordHash = createPasswordHash(input.password);
    const user = await this.prisma.user.create({
      data: {
        email: input.email,
        name: input.name,
        passwordHash,
        organizationId: input.organizationId,
        marketCode: input.marketCode,
      },
    });

    await this.prisma.member.create({
      data: {
        userId: user.id,
        organizationId: input.organizationId,
        role: input.roles[0] ?? "customer",
        status: "ACTIVE",
        marketCode: input.marketCode,
      },
    });

    return {
      userId: user.id,
      email: user.email,
      name: user.name,
      passwordHash: user.passwordHash ?? "",
      organizationId: input.organizationId,
      marketCode: input.marketCode,
      portal: input.portal,
      roles: input.roles,
    };
  }

  async validateCredentials(
    email: string,
    password: string,
  ): Promise<StoredUser> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        members: {
          where: { status: "ACTIVE" },
          include: {
            organization: true,
          },
        },
      },
    });

    if (!user || !verifyPassword(password, user.passwordHash ?? "")) {
      throw new UnauthorizedException("Credenciais inválidas");
    }

    const member = user.members[0];
    if (!member) {
      throw new UnauthorizedException("Utilizador sem organização ativa");
    }

    const portal = member.organization.type.toLowerCase() as PortalCode;
    const roles = [member.role];

    return {
      userId: user.id,
      email: user.email,
      name: user.name,
      passwordHash: user.passwordHash ?? "",
      organizationId: member.organizationId,
      marketCode: member.marketCode,
      portal,
      roles,
    };
  }

  async issueSession(userId: string): Promise<IssueSessionResult> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        members: {
          where: { status: "ACTIVE" },
          include: {
            organization: true,
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException("Utilizador desconhecido");
    }

    const member = user.members[0];
    if (!member) {
      throw new UnauthorizedException("Utilizador sem organização ativa");
    }

    const token = createSessionToken(this.jwtSecret);
    const expiresAt = new Date(Date.now() + SESSION_TTL_MINUTES * 60_000);

    await this.sessionStore?.create({
      userId: user.id,
      token,
      expiresAt,
    });

    return { token, expiresAt };
  }

  async requireSession(token: string): Promise<SessionInfo> {
    const session = await this.sessionStore?.findByToken(token);
    if (!session) {
      throw new UnauthorizedException("Sessão inválida ou expirada");
    }
    return session;
  }

  async revokeSession(token: string): Promise<void> {
    await this.sessionStore?.delete(token);
  }
}
