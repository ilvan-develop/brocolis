import { describe, expect, it } from "vitest";
import {
  acceptInvitationInputSchema,
  invitationSchema,
  inviteMemberInputSchema,
  memberSchema,
  organizationSchema,
  organizationSwitcherInputSchema,
} from "./tenant.js";

const uuid = "00000000-0000-4000-8000-000000000000";
const cuid = "c1234567890abcdefghijkl";

describe("tenant contracts", () => {
  it("valida organizationSchema com slug kebab-case", () => {
    const org = organizationSchema.parse({
      id: cuid,
      name: "Farmácia Central",
      slug: "farmacia-central",
      status: "ACTIVE",
      marketCode: "AO",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    expect(org.slug).toBe("farmacia-central");
  });

  it("rejeita organizationSchema com slug inválido", () => {
    expect(() =>
      organizationSchema.parse({
        id: cuid,
        name: "Farmácia",
        slug: "Farmácia Central!",
        status: "ACTIVE",
        marketCode: "AO",
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    ).toThrow();
  });

  it("valida memberSchema", () => {
    const member = memberSchema.parse({
      organizationId: uuid,
      userId: cuid,
      role: "PHARMACIST",
      status: "ACTIVE",
      createdAt: new Date(),
    });
    expect(member.role).toBe("PHARMACIST");
  });

  it("rejeita memberSchema com role desconhecida", () => {
    expect(() =>
      memberSchema.parse({
        organizationId: uuid,
        userId: cuid,
        role: "ROOT",
        status: "ACTIVE",
        createdAt: new Date(),
      }),
    ).toThrow();
  });

  it("valida invitationSchema com expiração", () => {
    const invitation = invitationSchema.parse({
      id: cuid,
      organizationId: uuid,
      email: "novo@example.com",
      role: "PHARMACIST",
      status: "PENDING",
      expiresAt: new Date("2030-01-01"),
      createdAt: new Date(),
    });
    expect(invitation.status).toBe("PENDING");
  });

  it("exige organizationId+marketCode em inviteMember e aplica default 7d", () => {
    const input = inviteMemberInputSchema.parse({
      organizationId: uuid,
      marketCode: "AO",
      email: "novo@example.com",
      role: "PHARMACIST",
    });
    expect(input.expiresInDays).toBe(7);
  });

  it("rejeita inviteMember sem organizationId (tenant isolation)", () => {
    expect(() =>
      inviteMemberInputSchema.parse({
        marketCode: "AO",
        email: "novo@example.com",
        role: "PHARMACIST",
      }),
    ).toThrow();
  });

  it("rejeita inviteMember sem marketCode (market isolation)", () => {
    expect(() =>
      inviteMemberInputSchema.parse({
        organizationId: uuid,
        email: "novo@example.com",
        role: "PHARMACIST",
      }),
    ).toThrow();
  });

  it("valida acceptInvitation com token + tenant/market", () => {
    const input = acceptInvitationInputSchema.parse({
      token: "token-secreto-de-16-char",
      organizationId: uuid,
      marketCode: "AO",
    });
    expect(input.token.length).toBeGreaterThanOrEqual(16);
  });

  it("rejeita acceptInvitation com token curto", () => {
    expect(() =>
      acceptInvitationInputSchema.parse({
        token: "abc",
        organizationId: uuid,
        marketCode: "AO",
      }),
    ).toThrow();
  });

  it("valida organizationSwitcher (org-switcher)", () => {
    const input = organizationSwitcherInputSchema.parse({
      userId: cuid,
      organizationId: uuid,
      marketCode: "AO",
    });
    expect(input.organizationId).toBe(uuid);
  });

  it("rejeita organizationSwitcher sem marketCode", () => {
    expect(() =>
      organizationSwitcherInputSchema.parse({
        userId: cuid,
        organizationId: uuid,
      }),
    ).toThrow();
  });
});
