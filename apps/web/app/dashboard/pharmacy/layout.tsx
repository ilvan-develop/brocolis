import { t } from "@brocolis/i18n";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { PharmacyNav } from "@/components/pharmacy/pharmacy-nav";
import { PharmacyProviders } from "@/components/pharmacy/pharmacy-providers";

export default function PharmacyLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <PharmacyProviders>
      <div className="flex min-h-screen flex-col">
        <header className="border-b">
          <div className="flex flex-col gap-4 px-6 py-4">
            <div className="inline-flex items-center gap-4">
              <Link
                href="/"
                className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
              >
                <ArrowLeft className="size-4" />
                {t("pharmacy.nav.back")}
              </Link>
              <h1 className="font-semibold tracking-tight text-2xl">
                {t("pharmacy.title")}
              </h1>
            </div>
            <PharmacyNav />
          </div>
        </header>
        <main className="flex flex-1 flex-col p-6">{children}</main>
      </div>
    </PharmacyProviders>
  );
}
