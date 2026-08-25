import type { Page } from "@playwright/test";

const BASE_URL = process.env.WEB_ORIGIN ?? "http://localhost:3000";

type SessionPayload = {
  user: { id: string; email: string; name: string; marketCode: string };
  organization: {
    id: string;
    name: string;
    slug: string;
    status: string;
    marketCode: string;
  };
  organizations: {
    id: string;
    name: string;
    slug: string;
    status: string;
    marketCode: string;
  }[];
  portal: string;
  roles: string[];
  marketCode: string;
};

async function setSession(page: Page, payload: SessionPayload) {
  return page.evaluate((data) => {
    window.localStorage.setItem("brocolis.session.v1", JSON.stringify(data));
  }, payload);
}

export async function signInAs(
  page: Page,
  user: { id: string; email: string; name: string; marketCode: string },
  organization: {
    id: string;
    name: string;
    slug: string;
    status: string;
    marketCode: string;
  },
  portal: string,
  roles: string[],
) {
  await page.goto(`${BASE_URL}/sign-in`);
  const payload: SessionPayload = {
    user,
    organization,
    organizations: [organization],
    portal,
    roles,
    marketCode: user.marketCode,
  };
  await setSession(page, payload);
  await page.goto(`${BASE_URL}/`);
}

export const FARMACY_USER = {
  id: "00000000-0000-4000-8000-000000000102",
  email: "farmacia@brocolis.ao",
  name: "Farmacêutico Central",
  marketCode: "AO",
};
export const FARMACY_ORG = {
  id: "00000000-0000-4000-8000-000000000002",
  name: "Farmacia Central",
  slug: "farmacia-central",
  status: "ACTIVE",
  marketCode: "AO",
};

export const CUSTOMER_USER = {
  id: "00000000-0000-4000-8000-000000000104",
  email: "cliente@brocolis.ao",
  name: "Cliente Demo",
  marketCode: "AO",
};
export const CUSTOMER_ORG = {
  id: "00000000-0000-4000-8000-000000000004",
  name: "Cliente Demo",
  slug: "cliente-demo",
  status: "ACTIVE",
  marketCode: "AO",
};

export const ADMIN_USER = {
  id: "00000000-0000-4000-8000-000000000101",
  email: "admin@brocolis.ao",
  name: "Admin Brócolis",
  marketCode: "AO",
};
export const ADMIN_ORG = {
  id: "00000000-0000-4000-8000-000000000001",
  name: "Brócolis Demo",
  slug: "brocolis-demo",
  status: "ACTIVE",
  marketCode: "AO",
};

export const BUSINESS_USER = {
  id: "00000000-0000-4000-8000-000000000201",
  email: "business@brocolis.ao",
  name: "Comprador Demo",
  marketCode: "AO",
};
export const BUSINESS_ORG = {
  id: "00000000-0000-4000-8000-000000000010",
  name: "Clínica Demo",
  slug: "clinica-demo",
  status: "ACTIVE",
  marketCode: "AO",
};

export const SUPPLIER_USER = {
  id: "00000000-0000-4000-8000-000000000103",
  email: "supplier@brocolis.ao",
  name: "Fornecedor Distribuidor",
  marketCode: "AO",
};
export const SUPPLIER_ORG = {
  id: "00000000-0000-4000-8000-000000000003",
  name: "Distribuidora SA",
  slug: "distribuidora-sa",
  status: "ACTIVE",
  marketCode: "AO",
};
