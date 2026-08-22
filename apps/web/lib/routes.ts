import type { Portal } from "@brocolis/contracts";

export const PORTAL_PREFIX: Record<Portal, string> = {
  CONSUMER: "/dashboard/consumer",
  PHARMACY: "/dashboard/pharmacy",
  SUPPLIER: "/dashboard/supplier",
  BUSINESS: "/dashboard/business",
  PLATFORM: "/admin",
};

const FULL_PORTAL_ROUTES: Record<Portal, readonly string[]> = {
  CONSUMER: [
    "/dashboard/consumer",
    "/dashboard/consumer/orders",
    "/dashboard/consumer/prescriptions",
    "/cart",
    "/checkout",
  ],
  PHARMACY: [
    "/dashboard/pharmacy",
    "/dashboard/pharmacy/overview",
    "/dashboard/pharmacy/orders",
    "/dashboard/pharmacy/catalog",
    "/dashboard/pharmacy/inventory",
    "/dashboard/pharmacy/prescriptions",
    "/dashboard/pharmacy/customers",
    "/dashboard/pharmacy/delivery",
    "/dashboard/pharmacy/finance",
    "/dashboard/pharmacy/settings",
  ],
  SUPPLIER: [
    "/dashboard/supplier",
    "/dashboard/supplier/overview",
    "/dashboard/supplier/catalog",
    "/dashboard/supplier/quotations",
    "/dashboard/supplier/purchase-orders",
    "/dashboard/supplier/logistics",
    "/dashboard/supplier/finance",
    "/dashboard/supplier/settings",
  ],
  BUSINESS: [
    "/dashboard/business",
    "/dashboard/business/procurement",
    "/dashboard/business/orders",
    "/dashboard/business/approvals",
    "/dashboard/business/inventory",
    "/dashboard/business/finance",
    "/dashboard/business/settings",
  ],
  PLATFORM: [
    "/admin",
    "/admin/overview",
    "/admin/marketplace",
    "/admin/organizations",
    "/admin/pharmacies",
    "/admin/suppliers",
    "/admin/orders",
    "/admin/prescriptions",
    "/admin/payments",
    "/admin/settlements",
    "/admin/audit",
    "/admin/logistics",
    "/admin/delivery",
    "/admin/compliance",
    "/admin/support",
    "/admin/analytics",
    "/admin/finance",
    "/admin/settings",
  ],
};

const WILDCARD = "*";

const PORTAL_ROLE_ROUTES: Record<Portal, Record<string, readonly string[]>> = {
  CONSUMER: {
    CONSUMER: FULL_PORTAL_ROUTES.CONSUMER,
  },
  PHARMACY: {
    OWNER: [WILDCARD],
    ADMIN: [WILDCARD],
    PHARMACIST: [
      "/dashboard/pharmacy",
      "/dashboard/pharmacy/orders",
      "/dashboard/pharmacy/prescriptions",
      "/dashboard/pharmacy/inventory",
      "/dashboard/pharmacy/delivery",
    ],
    FINANCE: ["/dashboard/pharmacy", "/dashboard/pharmacy/finance"],
    INVENTORY: [
      "/dashboard/pharmacy",
      "/dashboard/pharmacy/inventory",
      "/dashboard/pharmacy/orders",
      "/dashboard/pharmacy/delivery",
    ],
    VIEWER: ["/dashboard/pharmacy"],
  },
  SUPPLIER: {
    ADMIN: [WILDCARD],
    SALES: [
      "/dashboard/supplier",
      "/dashboard/supplier/catalog",
      "/dashboard/supplier/quotations",
      "/dashboard/supplier/purchase-orders",
    ],
    LOGISTICS: ["/dashboard/supplier", "/dashboard/supplier/logistics"],
    FINANCE: ["/dashboard/supplier", "/dashboard/supplier/finance"],
    VIEWER: ["/dashboard/supplier"],
  },
  BUSINESS: {
    ADMIN: [WILDCARD],
    BUYER: [
      "/dashboard/business",
      "/dashboard/business/procurement",
      "/dashboard/business/orders",
    ],
    APPROVER: ["/dashboard/business", "/dashboard/business/approvals"],
    FINANCE: ["/dashboard/business", "/dashboard/business/finance"],
    INVENTORY: ["/dashboard/business", "/dashboard/business/inventory"],
    VIEWER: ["/dashboard/business"],
  },
  PLATFORM: {
    OWNER: [WILDCARD],
    ADMIN: [WILDCARD],
    OPERATIONS: [
      "/admin",
      "/admin/marketplace",
      "/admin/orders",
      "/admin/delivery",
      "/admin/support",
    ],
    COMPLIANCE: ["/admin", "/admin/compliance", "/admin/audit"],
    FINANCE: [
      "/admin",
      "/admin/finance",
      "/admin/payments",
      "/admin/settlements",
    ],
    ANALYST: ["/admin", "/admin/analytics"],
    SUPPORT: ["/admin", "/admin/support", "/admin/orders"],
  },
};

function expandWildcards(portal: Portal, routes: readonly string[]): string[] {
  const expanded = new Set<string>();

  for (const route of routes) {
    if (route === WILDCARD) {
      for (const fullRoute of FULL_PORTAL_ROUTES[portal]) {
        expanded.add(fullRoute);
      }
      continue;
    }
    expanded.add(route);
  }

  return [...expanded].sort();
}

export function allowedRoutePrefixes(
  portal: Portal,
  roles: readonly string[],
): string[] {
  const roleRoutes = PORTAL_ROLE_ROUTES[portal];
  const routes: string[] = [];

  for (const role of roles) {
    const roleRoutesForRole = roleRoutes[role];
    if (!roleRoutesForRole) {
      continue;
    }
    routes.push(...roleRoutesForRole);
  }

  if (routes.length === 0) {
    return [];
  }

  return expandWildcards(portal, routes);
}

export function canAccessRoute(
  portal: Portal,
  roles: readonly string[],
  pathname: string,
): boolean {
  const prefixes = allowedRoutePrefixes(portal, roles);
  const base = PORTAL_PREFIX[portal];
  return prefixes.some((prefix) => {
    if (pathname === prefix) {
      return true;
    }
    if (prefix === base) {
      return false;
    }
    return pathname.startsWith(`${prefix}/`);
  });
}

export function defaultRouteFor(
  portal: Portal,
  roles: readonly string[],
): string | null {
  const prefixes = allowedRoutePrefixes(portal, roles);
  if (prefixes.length === 0) {
    return null;
  }
  if (prefixes.includes(PORTAL_PREFIX[portal])) {
    return PORTAL_PREFIX[portal];
  }
  return prefixes[0] ?? null;
}
