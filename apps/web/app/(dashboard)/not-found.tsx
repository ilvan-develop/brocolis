import { t } from "@brocolis/i18n";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
      <h1 className="text-4xl font-bold">404</h1>
      <p className="text-muted-foreground">{t("common.notFound")}</p>
      <Link href="/" className="text-primary underline">
        {t("common.backToHome")}
      </Link>
    </div>
  );
}
