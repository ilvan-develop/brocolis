import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./packages/db/src/generated/prisma/client.ts";

const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

db.$queryRaw`SELECT 1`
  .then(() => console.log("Conexão OK"))
  .catch((e) => console.error("ERRO:", e))
  .finally(async () => {
    await db.$disconnect();
  });
