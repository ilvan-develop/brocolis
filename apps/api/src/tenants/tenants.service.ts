import type { SessionInfo } from "@brocolis/auth";
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

export type TenantStatus = "ACTIVE" | "SUSPENDED" | "PENDING" | "CLOSED";

export type TenantRecord = {
  organizationId: string;
  name: string;
  slug: string;
  marketCode: string;
  status: TenantStatus;
  createdAt: Date;
};

export type MembershipStatus =
  | "ACTIVE"
  | "INVITED"
  | "SUSPENDED"
  | "DEACTIVATED";

export type TenantMembership = {
  organizationId: string;
  marketCode: string;
  role: string;
  status: MembershipStatus;
};

export type RegisterTenantInput = {
  organizationId: string;
  name: string;
  slug: string;
  marketCode: string;
  ownerUserId: string;
  ownerRole?: string;
};

/**
 * Tenants F1 — registo em memória + helpers puros de membership/org-switch.
 * Estado persiste em Prisma a partir das fases seguintes.
 */
@Injectable()
export class TenantsService {
  private readonly organizations = new Map<string, TenantRecord>();
  private readonly members = new Map<string, TenantMembership[]>();

  registerTenant(input: RegisterTenantInput): TenantRecord {
    const record: TenantRecord = {
      organizationId: input.organizationId,
      name: input.name,
      slug: input.slug,
      marketCode: input.marketCode,
      status: "ACTIVE",
      createdAt: new Date(),
    };
    this.organizations.set(record.organizationId, record);
    this.members.set(record.organizationId, [
      {
        organizationId: record.organizationId,
        marketCode: record.marketCode,
        role: input.ownerRole ?? "OWNER",
        status: "ACTIVE",
      },
    ]);
    return record;
  }

  listMembers(organizationId: string): TenantMembership[] {
    const members = this.members.get(organizationId);
    if (!members) {
      throw new NotFoundException(
        `Organização ${organizationId} não encontrada`,
      );
    }
    return members;
  }

  switchOrganization(
    current: SessionInfo,
    memberships: readonly TenantMembership[],
    targetOrganizationId: string,
  ): SessionInfo {
    const membership = memberships.find(
      (m) => m.organizationId === targetOrganizationId,
    );
    if (!membership) {
      throw new ForbiddenException("Não é membro da organização de destino");
    }
    if (membership.status !== "ACTIVE") {
      throw new ForbiddenException("Membership inativa");
    }
    return {
      ...current,
      organizationId: membership.organizationId,
      marketCode: membership.marketCode,
      roles: [membership.role],
    };
  }
}
