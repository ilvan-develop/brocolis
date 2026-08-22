import type { MessageKey } from "@brocolis/i18n";

export type PharmacyNavItem = {
  href: string;
  key: MessageKey;
};

export const PHARMACY_HOME = "/dashboard/pharmacy";

export const PHARMACY_NAV_ITEMS: readonly PharmacyNavItem[] = [
  { href: "/dashboard/pharmacy/overview", key: "pharmacy.nav.overview" },
  { href: "/dashboard/pharmacy/orders", key: "pharmacy.nav.orders" },
  { href: "/dashboard/pharmacy/catalog", key: "pharmacy.nav.catalog" },
  { href: "/dashboard/pharmacy/inventory", key: "pharmacy.nav.inventory" },
  {
    href: "/dashboard/pharmacy/prescriptions",
    key: "pharmacy.nav.prescriptions",
  },
  { href: "/dashboard/pharmacy/customers", key: "pharmacy.nav.customers" },
  { href: "/dashboard/pharmacy/delivery", key: "pharmacy.nav.delivery" },
  { href: "/dashboard/pharmacy/finance", key: "pharmacy.nav.finance" },
  { href: "/dashboard/pharmacy/settings", key: "pharmacy.nav.settings" },
];

export function isPharmacyNavItemActive(
  href: string,
  pathname: string,
): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}
