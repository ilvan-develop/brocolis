import { t } from "@brocolis/i18n";
import { CatalogGrid } from "@/components/storefront/catalog-grid";

export default function StorefrontHomePage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          {t("catalog.title")}
        </h1>
        <p className="text-muted-foreground text-sm">{t("catalog.subtitle")}</p>
      </div>
      <CatalogGrid />
    </div>
  );
}
