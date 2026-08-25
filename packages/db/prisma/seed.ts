import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  Availability,
  PrismaClient,
  StockMovementType,
} from "../src/generated/prisma/client.js";
import { database, getDatabaseUrl } from "../src/index.js";

const rootEnvPath = join(import.meta.dirname ?? "", "..", "..", "..", ".env");
try {
  const raw = readFileSync(rootEnvPath, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (key && !(key in process.env)) {
      process.env[key] = value;
    }
  }
} catch {
  // ignore missing .env
}

const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: getDatabaseUrl() }),
});
console.log("DATABASE_URL:", getDatabaseUrl());

type OrgRecord = {
  id: string;
  name: string;
  slug: string;
  type: string;
  marketCode: string;
};
type UserRecord = {
  id: string;
  email: string;
  name: string;
  status: "ACTIVE";
  marketCode: string;
  password: string;
};

function createPasswordHash(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, 32, { N: 16384, r: 8, p: 1 });
  return `scrypt$${salt}$${derived.toString("hex")}`;
}

const PASSWORD_HASH = createPasswordHash("Brocolis@123");
const USERS: UserRecord[] = [
  {
    id: "00000000-0000-4000-8000-000000000101",
    email: "admin@brocolis.ao",
    name: "Admin Brócolis",
    status: "ACTIVE" as const,
    marketCode: "AO",
    password: PASSWORD_HASH,
  },
  {
    id: "00000000-0000-4000-8000-000000000102",
    email: "farmacia@brocolis.ao",
    name: "Farmacêutico Central",
    status: "ACTIVE" as const,
    marketCode: "AO",
    password: PASSWORD_HASH,
  },
  {
    id: "00000000-0000-4000-8000-000000000103",
    email: "supplier@brocolis.ao",
    name: "Fornecedor Distribuidor",
    status: "ACTIVE" as const,
    marketCode: "AO",
    password: PASSWORD_HASH,
  },
  {
    id: "00000000-0000-4000-8000-000000000104",
    email: "cliente@brocolis.ao",
    name: "Cliente Demo",
    status: "ACTIVE" as const,
    marketCode: "AO",
    password: PASSWORD_HASH,
  },
];

const ORG_ID = "00000000-0000-4000-8000-000000000001";
const PHARMACY_ORG_ID = "00000000-0000-4000-8000-000000000002";
const SUPPLIER_ORG_ID = "00000000-0000-4000-8000-000000000003";
const CUSTOMER_ORG_ID = "00000000-0000-4000-8000-000000000004";

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
    { action: "pharmacy:verify", name: "Verificar farmácia" },
    { action: "delivery:manage", name: "Gerir entregas" },
    { action: "procurement:create", name: "Criar procurement" },
    { action: "procurement:approve", name: "Aprovar procurement" },
  ];

  for (const perm of permissions) {
    await db.permission.upsert({
      where: { action: perm.action },
      update: { name: perm.name },
      create: perm,
    });
  }

  const orgs: OrgRecord[] = [
    {
      id: ORG_ID,
      name: "Brócolis Demo",
      slug: "brocolis-demo",
      type: "PLATFORM",
      marketCode: "AO",
    },
    {
      id: PHARMACY_ORG_ID,
      name: "Farmacia Central",
      slug: "farmacia-central",
      type: "PHARMACY",
      marketCode: "AO",
    },
    {
      id: SUPPLIER_ORG_ID,
      name: "Distribuidora SA",
      slug: "distribuidora-sa",
      type: "SUPPLIER",
      marketCode: "AO",
    },
    {
      id: CUSTOMER_ORG_ID,
      name: "Cliente Demo",
      slug: "cliente-demo",
      type: "CUSTOMER",
      marketCode: "AO",
    },
  ];

  for (const org of orgs) {
    await db.organization.upsert({
      where: { id: org.id },
      update: {
        name: org.name,
        slug: org.slug,
        type: org.type,
        marketCode: org.marketCode,
        status: "ACTIVE" as const,
      },
      create: { ...org, status: "ACTIVE" as const },
    });
  }

  for (const user of USERS) {
    await db.user.upsert({
      where: { id: user.id },
      update: {
        email: user.email,
        name: user.name,
        status: user.status,
        marketCode: user.marketCode,
        passwordHash: user.password,
      },
      create: {
        id: user.id,
        email: user.email,
        name: user.name,
        status: user.status,
        marketCode: user.marketCode,
        emailVerified: true,
        passwordHash: user.password,
      },
    });
  }

  const members = [
    {
      userId: USERS[0]!.id,
      organizationId: ORG_ID,
      role: "admin",
      status: "ACTIVE" as const,
      marketCode: "AO",
    },
    {
      userId: USERS[1]!.id,
      organizationId: PHARMACY_ORG_ID,
      role: "pharmacist",
      status: "ACTIVE" as const,
      marketCode: "AO",
    },
    {
      userId: USERS[2]!.id,
      organizationId: SUPPLIER_ORG_ID,
      role: "supplier",
      status: "ACTIVE" as const,
      marketCode: "AO",
    },
    {
      userId: USERS[3]!.id,
      organizationId: CUSTOMER_ORG_ID,
      role: "customer",
      status: "ACTIVE" as const,
      marketCode: "AO",
    },
  ];

  for (const member of members) {
    await db.member.upsert({
      where: {
        organizationId_userId: {
          organizationId: member.organizationId,
          userId: member.userId,
        },
      },
      update: {
        role: member.role,
        status: member.status as any,
        marketCode: member.marketCode,
      },
      create: member,
    });
  }

  const categories = [
    {
      id: "cat-001",
      name: "Analgésicos",
      slug: "analgesicos",
      marketCode: "AO",
    },
    {
      id: "cat-002",
      name: "Antibióticos",
      slug: "antibioticos",
      marketCode: "AO",
    },
    { id: "cat-003", name: "Vitaminas", slug: "vitaminas", marketCode: "AO" },
    {
      id: "cat-004",
      name: "Anti-inflamatórios",
      slug: "anti-inflamatorios",
      marketCode: "AO",
    },
    {
      id: "cat-005",
      name: "Suplementos",
      slug: "suplementos",
      marketCode: "AO",
    },
  ];

  for (const cat of categories) {
    await db.category.upsert({
      where: { id: cat.id },
      update: cat,
      create: cat,
    });
  }

  const brands = [
    { id: "brand-001", name: "Brócolis Pharma", slug: "brocolis-pharma" },
    { id: "brand-002", name: "Distribuidora AO", slug: "distribuidora-ao" },
    { id: "brand-003", name: "GlobalMed", slug: "globalmed" },
  ];

  for (const brand of brands) {
    await db.brand.upsert({
      where: { id: brand.id },
      update: brand,
      create: brand,
    });
  }

  const globalProducts = [
    {
      id: "gp-001",
      name: "Paracetamol 500mg",
      dci: "Paracetamol",
      dosage: "500mg",
      form: "Comprimido",
      manufacturer: "Brócolis Pharma",
      active: true,
      brandId: "brand-001",
      categoryId: "cat-001",
    },
    {
      id: "gp-002",
      name: "Amoxicilina 250mg",
      dci: "Amoxicilina",
      dosage: "250mg",
      form: "Cápsula",
      manufacturer: "GlobalMed",
      active: true,
      brandId: "brand-003",
      categoryId: "cat-002",
    },
    {
      id: "gp-003",
      name: "Vitamina C 1000mg",
      dci: "Ácido Ascórbico",
      dosage: "1000mg",
      form: "Comprimido Efervescente",
      manufacturer: "Distribuidora AO",
      active: true,
      brandId: "brand-002",
      categoryId: "cat-003",
    },
    {
      id: "gp-004",
      name: "Ibuprofeno 400mg",
      dci: "Ibuprofeno",
      dosage: "400mg",
      form: "Comprimido",
      manufacturer: "Brócolis Pharma",
      active: true,
      brandId: "brand-001",
      categoryId: "cat-004",
    },
    {
      id: "gp-005",
      name: "Suplemento Ferro 50mg",
      dci: "Sulfato Ferroso",
      dosage: "50mg",
      form: "Comprimido",
      manufacturer: "GlobalMed",
      active: true,
      brandId: "brand-003",
      categoryId: "cat-005",
    },
  ];

  for (const product of globalProducts) {
    await db.globalProduct.upsert({
      where: { id: product.id },
      update: product,
      create: product,
    });
  }

  const countryProducts = [
    {
      id: "cp-001",
      globalProductId: "gp-001",
      countryCode: "AO",
      marketCode: "AO",
      name: "Paracetamol 500mg",
      prescriptionRequired: false,
      availability: Availability.AVAILABLE,
      referencePriceMinor: 500,
    },
    {
      id: "cp-002",
      globalProductId: "gp-002",
      countryCode: "AO",
      marketCode: "AO",
      name: "Amoxicilina 250mg",
      prescriptionRequired: true,
      availability: Availability.AVAILABLE,
      referencePriceMinor: 1200,
    },
    {
      id: "cp-003",
      globalProductId: "gp-003",
      countryCode: "AO",
      marketCode: "AO",
      name: "Vitamina C 1000mg",
      prescriptionRequired: false,
      availability: Availability.AVAILABLE,
      referencePriceMinor: 800,
    },
    {
      id: "cp-004",
      globalProductId: "gp-004",
      countryCode: "AO",
      marketCode: "AO",
      name: "Ibuprofeno 400mg",
      prescriptionRequired: false,
      availability: Availability.AVAILABLE,
      referencePriceMinor: 900,
    },
    {
      id: "cp-005",
      globalProductId: "gp-005",
      countryCode: "AO",
      marketCode: "AO",
      name: "Suplemento Ferro 50mg",
      prescriptionRequired: false,
      availability: Availability.AVAILABLE,
      referencePriceMinor: 1500,
    },
  ];

  for (const cp of countryProducts) {
    await db.countryProduct.upsert({
      where: { id: cp.id },
      update: cp,
      create: cp,
    });
  }

  const pharmacy = await db.pharmacy.upsert({
    where: { id: "pharmacy-001" },
    update: {
      organizationId: PHARMACY_ORG_ID,
      marketCode: "AO",
      name: "Farmacia Central",
      slug: "farmacia-central",
      address: "Rua Principal, Luanda",
      phone: "+244900000001",
      email: "farmacia@brocolis.ao",
      status: "ACTIVE",
    },
    create: {
      id: "pharmacy-001",
      organizationId: PHARMACY_ORG_ID,
      marketCode: "AO",
      name: "Farmacia Central",
      slug: "farmacia-central",
      address: "Rua Principal, Luanda",
      phone: "+244900000001",
      email: "farmacia@brocolis.ao",
      status: "ACTIVE",
    },
  });

  const pharmacy2 = await db.pharmacy.upsert({
    where: { id: "pharmacy-002" },
    update: {
      organizationId: PHARMACY_ORG_ID,
      marketCode: "AO",
      name: "Farmacia Sul",
      slug: "farmacia-sul",
      address: "Avenida da Saudade, Lubango",
      phone: "+244900000002",
      email: "farmacia-sul@brocolis.ao",
      status: "ACTIVE",
    },
    create: {
      id: "pharmacy-002",
      organizationId: PHARMACY_ORG_ID,
      marketCode: "AO",
      name: "Farmacia Sul",
      slug: "farmacia-sul",
      address: "Avenida da Saudade, Lubango",
      phone: "+244900000002",
      email: "farmacia-sul@brocolis.ao",
      status: "ACTIVE",
    },
  });

  const offers = [
    {
      id: "offer-001",
      organizationId: PHARMACY_ORG_ID,
      marketCode: "AO",
      countryProductId: "cp-001",
      pharmacyId: pharmacy.id,
      priceAmountMinor: 500,
      currency: "AOA",
      stock: 100,
      prescriptionRequired: false,
      status: "ACTIVE" as const,
    },
    {
      id: "offer-002",
      organizationId: PHARMACY_ORG_ID,
      marketCode: "AO",
      countryProductId: "cp-002",
      pharmacyId: pharmacy.id,
      priceAmountMinor: 1200,
      currency: "AOA",
      stock: 50,
      prescriptionRequired: true,
      status: "ACTIVE" as const,
    },
    {
      id: "offer-003",
      organizationId: PHARMACY_ORG_ID,
      marketCode: "AO",
      countryProductId: "cp-003",
      pharmacyId: pharmacy.id,
      priceAmountMinor: 800,
      currency: "AOA",
      stock: 200,
      prescriptionRequired: false,
      status: "ACTIVE" as const,
    },
    {
      id: "offer-004",
      organizationId: PHARMACY_ORG_ID,
      marketCode: "AO",
      countryProductId: "cp-004",
      pharmacyId: pharmacy2.id,
      priceAmountMinor: 900,
      currency: "AOA",
      stock: 75,
      prescriptionRequired: false,
      status: "ACTIVE" as const,
    },
    {
      id: "offer-005",
      organizationId: PHARMACY_ORG_ID,
      marketCode: "AO",
      countryProductId: "cp-005",
      pharmacyId: pharmacy2.id,
      priceAmountMinor: 1500,
      currency: "AOA",
      stock: 30,
      prescriptionRequired: false,
      status: "ACTIVE" as const,
    },
  ];

  for (const offer of offers) {
    await db.marketOffer.upsert({
      where: { id: offer.id },
      update: offer,
      create: offer,
    });
  }

  const inventoryItems = [
    {
      id: "inv-001",
      productId: "gp-001",
      pharmacyId: pharmacy.id,
      quantityOnHand: 100,
      reorderPoint: 20,
      organizationId: PHARMACY_ORG_ID,
      marketCode: "AO",
    },
    {
      id: "inv-002",
      productId: "gp-002",
      pharmacyId: pharmacy.id,
      quantityOnHand: 50,
      reorderPoint: 10,
      organizationId: PHARMACY_ORG_ID,
      marketCode: "AO",
    },
    {
      id: "inv-003",
      productId: "gp-003",
      pharmacyId: pharmacy.id,
      quantityOnHand: 200,
      reorderPoint: 30,
      organizationId: PHARMACY_ORG_ID,
      marketCode: "AO",
    },
    {
      id: "inv-004",
      productId: "gp-004",
      pharmacyId: pharmacy2.id,
      quantityOnHand: 75,
      reorderPoint: 15,
      organizationId: PHARMACY_ORG_ID,
      marketCode: "AO",
    },
    {
      id: "inv-005",
      productId: "gp-005",
      pharmacyId: pharmacy2.id,
      quantityOnHand: 30,
      reorderPoint: 10,
      organizationId: PHARMACY_ORG_ID,
      marketCode: "AO",
    },
  ];

  for (const item of inventoryItems) {
    await db.inventoryItem.upsert({
      where: { id: item.id },
      update: item,
      create: item,
    });
  }

  const supplier = await db.supplier.upsert({
    where: { id: SUPPLIER_ORG_ID },
    update: {
      organizationId: SUPPLIER_ORG_ID,
      marketCode: "AO",
      name: "Distribuidora SA",
      slug: "distribuidora-sa",
      status: "ACTIVE",
      contactEmail: "supplier@brocolis.ao",
      contactPhone: "+244900000003",
    },
    create: {
      id: SUPPLIER_ORG_ID,
      organizationId: SUPPLIER_ORG_ID,
      marketCode: "AO",
      name: "Distribuidora SA",
      slug: "distribuidora-sa",
      status: "ACTIVE",
      contactEmail: "supplier@brocolis.ao",
      contactPhone: "+244900000003",
    },
  });

  const priceTiers = [
    {
      id: "tier-001",
      supplierId: SUPPLIER_ORG_ID,
      productId: "gp-001",
      minQty: 1,
      maxQty: 49,
      unitPriceMinor: 300,
    },
    {
      id: "tier-002",
      supplierId: SUPPLIER_ORG_ID,
      productId: "gp-001",
      minQty: 50,
      maxQty: 199,
      unitPriceMinor: 280,
    },
    {
      id: "tier-003",
      supplierId: SUPPLIER_ORG_ID,
      productId: "gp-001",
      minQty: 200,
      unitPriceMinor: 260,
    },
    {
      id: "tier-004",
      supplierId: SUPPLIER_ORG_ID,
      productId: "gp-002",
      minQty: 1,
      maxQty: 24,
      unitPriceMinor: 800,
    },
    {
      id: "tier-005",
      supplierId: SUPPLIER_ORG_ID,
      productId: "gp-003",
      minQty: 1,
      unitPriceMinor: 600,
    },
  ];

  for (const tier of priceTiers) {
    await db.priceTier.upsert({
      where: { id: tier.id },
      update: tier,
      create: tier,
    });
  }

  const volumePrices = [
    {
      id: "vp-001",
      supplierId: SUPPLIER_ORG_ID,
      productId: "gp-001",
      minVolume: 100,
      discountBps: 500,
    },
    {
      id: "vp-002",
      supplierId: SUPPLIER_ORG_ID,
      productId: "gp-002",
      minVolume: 50,
      discountBps: 300,
    },
  ];

  for (const vp of volumePrices) {
    await db.volumePrice.upsert({
      where: { id: vp.id },
      update: vp,
      create: vp,
    });
  }

  const orders = [
    {
      id: "order-001",
      organizationId: CUSTOMER_ORG_ID,
      marketCode: "AO",
      customerId: USERS[3]!.id,
      status: "DELIVERED" as any,
      subtotalAmountMinor: 1700,
      deliveryFeeAmountMinor: 0,
      vatAmountMinor: 0,
      discountAmountMinor: 0,
      totalAmountMinor: 1700,
      currency: "AOA",
    },
    {
      id: "order-002",
      organizationId: CUSTOMER_ORG_ID,
      marketCode: "AO",
      customerId: USERS[3]!.id,
      status: "PROCESSING" as any,
      subtotalAmountMinor: 900,
      deliveryFeeAmountMinor: 0,
      vatAmountMinor: 0,
      discountAmountMinor: 0,
      totalAmountMinor: 900,
      currency: "AOA",
    },
  ];

  for (const order of orders) {
    await db.order.upsert({
      where: { id: order.id },
      update: order,
      create: order,
    });
  }

  const orderItems = [
    {
      id: "oi-001",
      orderId: "order-001",
      productId: "gp-001",
      pharmacyId: pharmacy.id,
      quantity: 2,
      unitPriceMinor: 500,
      lineTotalMinor: 1000,
      currency: "AOA",
    },
    {
      id: "oi-002",
      orderId: "order-001",
      productId: "gp-003",
      pharmacyId: pharmacy.id,
      quantity: 1,
      unitPriceMinor: 700,
      lineTotalMinor: 700,
      currency: "AOA",
    },
    {
      id: "oi-003",
      orderId: "order-002",
      productId: "gp-004",
      pharmacyId: pharmacy2.id,
      quantity: 1,
      unitPriceMinor: 900,
      lineTotalMinor: 900,
      currency: "AOA",
    },
  ];

  for (const item of orderItems) {
    await db.orderItem.upsert({
      where: { id: item.id },
      update: item,
      create: item,
    });
  }

  const stockMovements = [
    {
      id: "sm-001",
      itemId: "inv-001",
      type: StockMovementType.RECEIPT,
      qty: 150,
      organizationId: PHARMACY_ORG_ID,
      marketCode: "AO",
      reason: "Receção de stock",
    },
    {
      id: "sm-002",
      itemId: "inv-001",
      type: StockMovementType.DISPENSE,
      qty: 50,
      organizationId: PHARMACY_ORG_ID,
      marketCode: "AO",
      reason: "Vendas",
    },
    {
      id: "sm-003",
      itemId: "inv-002",
      type: StockMovementType.RECEIPT,
      qty: 60,
      organizationId: PHARMACY_ORG_ID,
      marketCode: "AO",
      reason: "Receção de stock",
    },
    {
      id: "sm-004",
      itemId: "inv-002",
      type: StockMovementType.DISPENSE,
      qty: 10,
      organizationId: PHARMACY_ORG_ID,
      marketCode: "AO",
      reason: "Vendas",
    },
  ];

  for (const sm of stockMovements) {
    await db.stockMovement.upsert({
      where: { id: sm.id },
      update: sm,
      create: sm,
    });
  }

  console.log("Seed completo executado com sucesso.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
