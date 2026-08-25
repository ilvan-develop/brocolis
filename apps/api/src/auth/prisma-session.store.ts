import { Injectable } from "@nestjs/common";
import type { PrismaClient } from "@brocolis/db/src/generated/prisma/client.js";

@Injectable()
export class PrismaSessionStore {
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: {
    userId: string;
    token: string;
    expiresAt: Date;
    ipAddress?: string;
    userAgent?: string;
  }) {
    return this.prisma.session.create({
      data: {
        userId: data.userId,
        token: data.token,
        expiresAt: data.expiresAt,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      },
    });
  }

  async findByToken(token: string) {
    const session = await this.prisma.session.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!session || session.expiresAt < new Date()) {
      return null;
    }

    return session;
  }

  async delete(token: string) {
    return this.prisma.session.delete({
      where: { token },
    });
  }

  async deleteByUserId(userId: string) {
    return this.prisma.session.deleteMany({
      where: { userId },
    });
  }
}
