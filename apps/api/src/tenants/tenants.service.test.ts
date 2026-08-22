import type { SessionInfo } from "@brocolis/auth";
import { ForbiddenException, NotFoundException } from "@nestjs/common";
import { describe, expect, it } from "vitest";
import { TenantsService } from "./tenants.service.js";

const uuid = "00000000-0000-4000-8000-000000000000";

const current: SessionInfo = {
  userId: "u1",
  organizationId: uuid,
  marketCode: "AO",
  portal: "PHARMACY",
  roles: ["VIEWER"],
};

describe("TenantsService", () => {
  it("regista um tenant e promove o dono (OWNER)", () => {
    const tenants = new TenantsService();
    const record = tenants.registerTenant({
      organizationId: uuid,
      name: "Farmácia Central",
      slug: "farmacia-central",
      marketCode: "AO",
      ownerUserId: "u1",
    });
    expect(record.status).toBe("ACTIVE");

    const members = tenants.listMembers(uuid);
    expect(members).toHaveLength(1);
    expect(members[0]?.role).toBe("OWNER");
    expect(members[0]?.status).toBe("ACTIVE");
  });

  it("lança NotFoundException ao listar tenant desconhecido", () => {
    const tenants = new TenantsService();
    expect(() => tenants.listMembers("nao-existe")).toThrowError(
      NotFoundException,
    );
  });

  it("comuta de organização quando o utilizador é membro", () => {
    const tenants = new TenantsService();
    const switched = tenants.switchOrganization(
      current,
      [
        {
          organizationId: uuid,
          marketCode: "AO",
          role: "VIEWER",
          status: "ACTIVE",
        },
        {
          organizationId: "org-2",
          marketCode: "AO",
          role: "OWNER",
          status: "ACTIVE",
        },
      ],
      "org-2",
    );
    expect(switched.organizationId).toBe("org-2");
    expect(switched.roles).toEqual(["OWNER"]);
    expect(switched.userId).toBe("u1");
  });

  it("nega comutação para organização sem membership", () => {
    const tenants = new TenantsService();
    expect(() =>
      tenants.switchOrganization(
        current,
        [
          {
            organizationId: uuid,
            marketCode: "AO",
            role: "VIEWER",
            status: "ACTIVE",
          },
        ],
        "org-2",
      ),
    ).toThrowError(ForbiddenException);
  });

  it("nega comutação com membership inativa", () => {
    const tenants = new TenantsService();
    expect(() =>
      tenants.switchOrganization(
        current,
        [
          {
            organizationId: "org-2",
            marketCode: "AO",
            role: "BUYER",
            status: "INVITED",
          },
        ],
        "org-2",
      ),
    ).toThrowError(ForbiddenException);
  });
});
