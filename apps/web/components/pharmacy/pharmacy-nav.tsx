"use client";

import { t } from "@brocolis/i18n";
import { cn } from "@brocolis/ui";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  isPharmacyNavItemActive,
  PHARMACY_NAV_ITEMS,
} from "@/lib/pharmacy-nav";

export function PharmacyNav() {
  const pathname = usePathname();

  return (
    <nav
      className="flex flex-wrap gap-1"
      aria-label={t("pharmacy.nav.overview")}
    >
      {PHARMACY_NAV_ITEMS.map((item) => {
        const active = isPharmacyNavItemActive(item.href, pathname);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              active
                ? "bg-secondary text-secondary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
            )}
          >
            {t(item.key)}
          </Link>
        );
      })}
    </nav>
  );
}
