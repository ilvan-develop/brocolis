import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import type {} from "better-auth";
import { z } from "zod";

export const portalCodeSchema = z.enum([
  "CONSUMER",
  "PHARMACY",
  "SUPPLIER",
  "BUSINESS",
  "PLATFORM",
]);

export type PortalCode = z.infer<typeof portalCodeSchema>;

export type SessionInfo = {
  userId: string;
  organizationId: string;
  marketCode: string;
  portal: PortalCode;
  roles: string[];
};

export type AuthWire = {
  serverUrl: string;
  /** Contrato de arranque do Better Auth — ligado na F1 (IAM + Tenants). */
  ready: false;
};

export const AUTH_SERVER_URL = "/api/auth";

export function wire(): AuthWire {
  return { serverUrl: AUTH_SERVER_URL, ready: false };
}

export const SESSION_IDLE_TIMEOUT_MINUTES = 30;

export type RbacAction =
  | "catalog:read"
  | "catalog:write"
  | "catalog:publish"
  | "pharmacy:read"
  | "pharmacy:verify"
  | "inventory:read"
  | "inventory:update"
  | "inventory:batch"
  | "orders:read"
  | "orders:create"
  | "orders:update"
  | "orders:fulfill"
  | "orders:return"
  | "procurement:read"
  | "procurement:create"
  | "procurement:approve"
  | "prescription:read"
  | "prescription:validate"
  | "prescription:dispense"
  | "payments:read"
  | "payments:refund"
  | "settlements:read"
  | "delivery:read"
  | "delivery:manage"
  | "members:read"
  | "members:invite"
  | "members:update_role"
  | "tenant:read"
  | "tenant:update"
  | "billing:read"
  | "billing:manage"
  | "settings:read"
  | "settings:update"
  | "analytics:read"
  | "audit:read"
  | "compliance:read"
  | "compliance:decide"
  | "support:read"
  | "support:manage"
  | "marketplace:manage";

const ALL = "*";

export type RbacRoleSpec = {
  actions: string[];
};

/**
 * Matriz RBAC por portal (blueprint/05 §1).
 * OWNER/ADMIN/`platform_admin` têm `"*"` (todas as acções do portal).
 */
export const RBAC_ROLES: Record<PortalCode, Record<string, RbacRoleSpec>> = {
  CONSUMER: {
    CONSUMER: {
      actions: [
        "catalog:read",
        "orders:create",
        "orders:read",
        "orders:return",
        "payments:read",
        "prescription:read",
        "delivery:read",
        "settings:read",
        "settings:update",
      ],
    },
  },
  PHARMACY: {
    OWNER: { actions: [ALL] },
    ADMIN: { actions: [ALL] },
    PHARMACIST: {
      actions: [
        "prescription:read",
        "prescription:validate",
        "prescription:dispense",
        "orders:read",
        "orders:fulfill",
        "inventory:read",
        "inventory:update",
        "catalog:read",
        "delivery:read",
      ],
    },
    FINANCE: {
      actions: [
        "payments:read",
        "settlements:read",
        "billing:read",
        "analytics:read",
      ],
    },
    INVENTORY: {
      actions: [
        "inventory:read",
        "inventory:update",
        "inventory:batch",
        "orders:read",
        "orders:update",
        "delivery:read",
      ],
    },
    VIEWER: {
      actions: [
        "catalog:read",
        "orders:read",
        "inventory:read",
        "payments:read",
        "analytics:read",
        "prescription:read",
      ],
    },
  },
  SUPPLIER: {
    ADMIN: { actions: [ALL] },
    SALES: {
      actions: [
        "catalog:read",
        "catalog:write",
        "procurement:read",
        "orders:read",
        "analytics:read",
      ],
    },
    LOGISTICS: {
      actions: [
        "delivery:manage",
        "delivery:read",
        "inventory:read",
        "inventory:update",
        "orders:read",
      ],
    },
    FINANCE: {
      actions: [
        "payments:read",
        "settlements:read",
        "billing:read",
        "analytics:read",
      ],
    },
    VIEWER: {
      actions: ["catalog:read", "procurement:read", "orders:read"],
    },
  },
  BUSINESS: {
    ADMIN: { actions: [ALL] },
    BUYER: {
      actions: [
        "catalog:read",
        "procurement:create",
        "procurement:read",
        "orders:create",
        "orders:read",
      ],
    },
    APPROVER: {
      actions: ["procurement:read", "procurement:approve"],
    },
    FINANCE: {
      actions: ["payments:read", "billing:read"],
    },
    INVENTORY: {
      actions: ["inventory:read", "inventory:update"],
    },
    VIEWER: {
      actions: ["catalog:read", "procurement:read", "orders:read"],
    },
  },
  PLATFORM: {
    OWNER: { actions: [ALL] },
    ADMIN: { actions: [ALL] },
    OPERATIONS: {
      actions: [
        "marketplace:manage",
        "orders:read",
        "orders:update",
        "delivery:manage",
        "support:manage",
        "catalog:publish",
      ],
    },
    COMPLIANCE: {
      actions: [
        "compliance:read",
        "compliance:decide",
        "audit:read",
        "pharmacy:verify",
      ],
    },
    FINANCE: {
      actions: [
        "settlements:read",
        "payments:read",
        "billing:manage",
        "analytics:read",
      ],
    },
    ANALYST: {
      actions: [
        "analytics:read",
        "catalog:read",
        "orders:read",
        "payments:read",
        "audit:read",
      ],
    },
    SUPPORT: {
      actions: ["support:read", "support:manage", "orders:read"],
    },
  },
};

function collectRoleActions(role: string): string[] {
  const actions: string[] = [];
  for (const roles of Object.values(RBAC_ROLES)) {
    const spec = roles[role];
    if (!spec) {
      continue;
    }
    for (const action of spec.actions) {
      if (!actions.includes(action)) {
        actions.push(action);
      }
    }
  }
  return actions;
}

/** Verifica se `role` pode executar `resource:action` (aceita wildcard `"*"`). */
export function can(role: string, action: string, resource: string): boolean {
  const required = `${resource}:${action}`;
  const actions = collectRoleActions(role);
  return actions.includes(ALL) || actions.includes(required);
}

/** Verifica se o conjunto de roles do utilizador contém `required`. */
export function hasRole(
  userRoles: readonly string[],
  required: string,
): boolean {
  return userRoles.includes(required);
}

const SCRYPT_PARAMS = { N: 16384, r: 8, p: 1, keylen: 32 } as const;

/** Hash scrypt OWASP-like (N=16384, keylen=32) com salt aleatório. */
export function createPasswordHash(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, SCRYPT_PARAMS.keylen, {
    N: SCRYPT_PARAMS.N,
    r: SCRYPT_PARAMS.r,
    p: SCRYPT_PARAMS.p,
  });
  return `scrypt$${salt}$${derived.toString("hex")}`;
}

/** Verificação timing-safe do hash scrypt produzido por createPasswordHash. */
export function verifyPassword(password: string, stored: string): boolean {
  const [algorithm, salt, expectedHex] = stored.split("$");
  if (algorithm !== "scrypt" || !salt || !expectedHex) {
    return false;
  }
  const expected = Buffer.from(expectedHex, "hex");
  const actual = scryptSync(password, salt, expected.length, {
    N: SCRYPT_PARAMS.N,
    r: SCRYPT_PARAMS.r,
    p: SCRYPT_PARAMS.p,
  });
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

import jwt from "jsonwebtoken";

export function createSessionToken(secret: string): string {
  const payload = {
    sub: randomBytes(32).toString("hex"),
    iat: Math.floor(Date.now() / 1000),
  };
  return jwt.sign(payload, secret, { expiresIn: "24h" });
}

export function verifySessionToken(
  token: string,
  secret: string,
): { sub: string } | null {
  try {
    const decoded = jwt.verify(token, secret) as { sub: string };
    return { sub: decoded.sub };
  } catch {
    return null;
  }
}
