/**
 * Proxy do cliente de base de dados.
 *
 * Único ponto do monorepo que instancia PrismaClient (regra AP-01).
 * O cliente é gerado para src/generated/prisma (generator prisma-client,
 * Prisma 7) e ligado via driver adapter pg.
 */

import type { PrismaClient as PrismaClientType } from "./generated/prisma/client.js";
export { PrismaClient } from "./generated/prisma/client.js";

let prisma: PrismaClientType | null = null;

export function getDatabaseUrl(env = process.env): string {
  const url = env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL não definido. Copie .env.example para .env e configure Postgres.",
    );
  }
  return url;
}

/** Proxied PrismaClient — inicializado via establishDatabase().
 *  Nunca importe o cliente gerado fora de @brocolis/db.
 */
export function getDatabase(): PrismaClientType {
  if (!prisma) {
    throw new Error(
      "Base de dados ainda não inicializada. Chame establishDatabase() antes.",
    );
  }
  return prisma;
}

export async function establishDatabase(): Promise<PrismaClientType> {
  if (prisma) {
    return prisma;
  }
  const { PrismaPg } = await import("@prisma/adapter-pg");
  const { PrismaClient } = await import("./generated/prisma/client.js");
  const adapter = new PrismaPg({ connectionString: getDatabaseUrl() });
  prisma = new PrismaClient({ adapter });
  return prisma;
}

/** Acesso tipado ao client (Prisma 7, generator prisma-client). */
export function database(): PrismaClientType {
  return getDatabase();
}
