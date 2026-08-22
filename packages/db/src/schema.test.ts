import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const schema = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "../prisma/schema.prisma"),
  "utf8",
);

const IAM_TENANT_MODELS = [
  "User",
  "Session",
  "Account",
  "Verification",
  "TwoFactor",
  "Role",
  "Permission",
  "RolePermission",
  "Organization",
  "OrgSetting",
  "OrgFeatureFlag",
  "Member",
  "Invitation",
  "WhiteLabelConfig",
];

describe("prisma schema — F1 IAM + Tenants", () => {
  it("define todos os modelos de IAM + Tenants", () => {
    for (const model of IAM_TENANT_MODELS) {
      expect(schema).toContain(`model ${model} {`);
    }
  });

  it("define os enums de status/roles", () => {
    for (const en of [
      "UserStatus",
      "MembershipStatus",
      "InvitationStatus",
      "TwoFactorType",
      "OrgStatus",
    ]) {
      expect(schema).toContain(`enum ${en} {`);
    }
  });

  it('aplica @@map("snake_case") a cada modelo de IAM + Tenants', () => {
    for (const model of IAM_TENANT_MODELS) {
      const block = schema.match(
        new RegExp(`model ${model} \\{[\\s\\S]*?\\n\\}`),
      )?.[0];
      expect(block, `modelo ${model} não encontrado`).toBeTruthy();
      expect(block).toMatch(/@@map\("[a-z_]+"\)/);
    }
  });

  it("indexa (organizationId, marketCode, createdAt) nos modelos scoped", () => {
    const occurrences = (
      schema.match(/@@index\(\[organizationId, marketCode, createdAt\]\)/g) ??
      []
    ).length;
    expect(occurrences).toBeGreaterThanOrEqual(3);
  });

  it("mantém AuditEvent append-only como fundação comum", () => {
    expect(schema).toContain("model AuditEvent {");
    expect(schema).toContain('@@map("audit_events")');
  });
});
