import { describe, expect, it, vi } from "vitest";
import { ApiError, createApiClient } from "./api";

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const sessionInfo = {
  userId: "c1234567890abcdefghijkl",
  organizationId: "00000000-0000-4000-8000-000000000001",
  marketCode: "AO",
  portal: "PHARMACY",
  roles: ["OWNER"],
};

const organization = {
  id: "00000000-0000-4000-8000-000000000001",
  name: "Farmácia Luanda",
  slug: "farmacia-luanda",
  status: "ACTIVE",
  marketCode: "AO",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

describe("api — client injectable via fetch", () => {
  it("signIn faz POST para /api/auth/sign-in com o corpo esperado", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      jsonResponse(200, {
        user: {
          id: "c1234567890abcdefghijkl",
          email: "ana@example.com",
          name: "Ana",
          emailVerified: false,
          marketCode: "AO",
        },
        session: {
          token: "a".repeat(64),
          expiresAt: "2026-02-01T00:00:00.000Z",
        },
        organizations: [organization],
      }),
    );

    const client = createApiClient({ fetchImpl });
    const result = await client.auth.signIn({
      email: "ana@example.com",
      password: "senha-segura",
    });

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const [url, init] = fetchImpl.mock.calls[0]!;
    expect(url).toBe("/api/auth/sign-in");
    expect(init.method).toBe("POST");
    expect(JSON.parse((init.body as string) ?? "{}")).toEqual({
      email: "ana@example.com",
      password: "senha-segura",
    });
    expect(result.user.email).toBe("ana@example.com");
    expect(result.organizations).toHaveLength(1);
  });

  it("signIn lança ApiError com status em respostas de erro", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(
        jsonResponse(401, { message: "Credenciais inválidas" }),
      );

    const client = createApiClient({ fetchImpl });
    const promise = client.auth.signIn({ email: "a@b.com", password: "x" });

    await expect(promise).rejects.toBeInstanceOf(ApiError);
    await expect(promise).rejects.toMatchObject({ status: 401 });
  });

  it("getSession devolve SessionInfo em 200", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse(200, sessionInfo));

    const client = createApiClient({ fetchImpl });
    const session = await client.auth.getSession();

    expect(fetchImpl).toHaveBeenCalledWith(
      "/api/auth/session",
      expect.objectContaining({ method: "GET" }),
    );
    expect(session?.portal).toBe("PHARMACY");
    expect(session?.roles).toEqual(["OWNER"]);
  });

  it("getSession devolve null em 404 (sem sessão)", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse(404, {}));

    const client = createApiClient({ fetchImpl });
    const session = await client.auth.getSession();

    expect(session).toBeNull();
  });

  it("organizations.switch faz POST para /api/tenants/switch", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse(200, sessionInfo));

    const client = createApiClient({ fetchImpl });
    const result = await client.organizations.switch({
      organizationId: "00000000-0000-4000-8000-000000000002",
    });

    const [url, init] = fetchImpl.mock.calls[0]!;
    expect(url).toBe("/api/tenants/switch");
    expect(init.method).toBe("POST");
    expect(JSON.parse((init.body as string) ?? "{}")).toEqual({
      organizationId: "00000000-0000-4000-8000-000000000002",
    });
    expect(result.organizationId).toBe(sessionInfo.organizationId);
  });

  it("organizations.inviteMember faz POST com o convite e devolve a Invitation", async () => {
    const invitation = {
      id: "c00000000000000000000001",
      organizationId: organization.id,
      email: "nova@example.com",
      role: "PHARMACIST",
      status: "PENDING",
      expiresAt: "2026-02-01T00:00:00.000Z",
      createdAt: "2026-01-25T00:00:00.000Z",
    };

    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse(201, invitation));

    const client = createApiClient({ fetchImpl });
    const result = await client.organizations.inviteMember({
      organizationId: organization.id,
      email: "nova@example.com",
      role: "PHARMACIST",
      expiresInDays: 7,
    });

    const [url, init] = fetchImpl.mock.calls[0]!;
    expect(url).toBe(
      "/api/tenants/organizations/00000000-0000-4000-8000-000000000001/invites",
    );
    expect(init.method).toBe("POST");
    expect(JSON.parse((init.body as string) ?? "{}")).toMatchObject({
      email: "nova@example.com",
      role: "PHARMACIST",
    });
    expect(result.status).toBe("PENDING");
  });

  it("organizations.listMembers devolve uma lista de membros", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      jsonResponse(200, [
        {
          organizationId: organization.id,
          userId: "c1234567890abcdefghijkl",
          role: "OWNER",
          status: "ACTIVE",
          createdAt: "2026-01-01T00:00:00.000Z",
        },
      ]),
    );

    const client = createApiClient({ fetchImpl });
    const members = await client.organizations.listMembers(organization.id);

    expect(members).toHaveLength(1);
    expect(members[0]?.role).toBe("OWNER");
  });
});
