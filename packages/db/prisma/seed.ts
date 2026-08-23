import { database, getDatabaseUrl } from "../src/index.js";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: getDatabaseUrl() }) });
type OrgRecord = { id: string; name: string; slug: string; type: string; marketCode: string };
type UserRecord = { id: string; email: string; name: string; status: "ACTIVE"; marketCode: string };
type MemberRecord = { userId: string; organizationId: string; role: string; status: string; marketCode: string };

async function main() {
  await db.$executeRaw`CREATE EXTENSION IF NOT EXISTS pgcrypto;`;

  const permissions = [
    { action: "payment:create", name: "Criar pagamento" },
    { action: "payment:read", name: "Ver pagamento" },
    { action: "order:create", name: "Criar pedido" },
    { action: "order:read", name: "Ver pedido" },
    { action: "catalog:read", name: "Ver catálogo" },
    { action: "inventory:read", name: "Ver inventário" },
    { action: "compliance:read", name: "Ver compliance" },
    { action: "admin:access", name: "Acesso admin" },
  ];

  for (const perm of permissions) {
    await db.permission.upsert({
      where: { action: perm.action },
      update: { name: perm.name },
      create: perm,
    });
  }

  const orgs: OrgRecord[] = [
    { id: "00000000-0000-4000-8000-000000000001", name: "Brócolis Demo", slug: "brocolis-demo", type: "PLATFORM", marketCode: "AO" },
    { id: "00000000-0000-4000-8000-000000000002", name: "Farmacia Central", slug: "farmacia-central", type: "PHARMACY", marketCode: "AO" },
    { id: "00000000-0000-4000-8000-000000000003", name: "Distribuidora SA", slug: "distribuidora-sa", type: "SUPPLIER", marketCode: "AO" },
    { id: "00000000-0000-4000-8000-000000000004", name: "Cliente Demo", slug: "cliente-demo", type: "CUSTOMER", marketCode: "AO" },
  ];

  for (const org of orgs) {
    await db.organization.upsert({
      where: { id: org.id },
      update: { name: org.name, slug: org.slug, type: org.type, marketCode: org.marketCode, status: "ACTIVE" as const },
      create: { ...org, status: "ACTIVE" as const },
    });
  }

  const users: UserRecord[] = [
    { id: "00000000-0000-4000-8000-000000000101", email: "admin@brocolis.ao", name: "Admin Brócolis", status: "ACTIVE" as const, marketCode: "AO" },
    { id: "00000000-0000-4000-8000-000000000102", email: "farmacia@brocolis.ao", name: "Farmacêutico Central", status: "ACTIVE" as const, marketCode: "AO" },
    { id: "00000000-0000-4000-8000-000000000103", email: "supplier@brocolis.ao", name: "Fornecedor Distribuidor", status: "ACTIVE" as const, marketCode: "AO" },
    { id: "00000000-0000-4000-8000-000000000104", email: "cliente@brocolis.ao", name: "Cliente Demo", status: "ACTIVE" as const, marketCode: "AO" },
  ];

  for (const user of users) {
    await db.user.upsert({
      where: { id: user.id },
      update: { email: user.email, name: user.name, status: user.status, marketCode: user.marketCode },
      create: { ...user, emailVerified: true, passwordHash: "$2a$10$dummy.hash.for.seed.only" },
    });
  }

  const members = [
    { userId: users[0]!.id, organizationId: orgs[0]!.id, role: "admin", status: "ACTIVE" as const, marketCode: "AO" },
    { userId: users[1]!.id, organizationId: orgs[1]!.id, role: "pharmacist", status: "ACTIVE" as const, marketCode: "AO" },
    { userId: users[2]!.id, organizationId: orgs[2]!.id, role: "supplier", status: "ACTIVE" as const, marketCode: "AO" },
    { userId: users[3]!.id, organizationId: orgs[3]!.id, role: "customer", status: "ACTIVE" as const, marketCode: "AO" },
  ];

  for (const member of members) {
    await db.member.upsert({
      where: { organizationId_userId: { organizationId: member.organizationId, userId: member.userId } },
      update: { role: member.role, status: member.status as any, marketCode: member.marketCode },
      create: member,
    });
  }

  console.log("Seed executado com sucesso.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
