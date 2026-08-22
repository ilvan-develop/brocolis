import { t } from "@brocolis/i18n";
import { Badge } from "@brocolis/ui/components/badge";
import { Card, CardContent } from "@brocolis/ui/components/card";

export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <main className="bg-muted/40 flex min-h-screen flex-col items-center justify-center gap-6 p-6">
      <header className="flex flex-col items-center gap-1 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Brócolis</h1>
        <Badge>{t("pharmacy.verified")}</Badge>
      </header>

      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col gap-6 py-6">
          {children}
        </CardContent>
      </Card>
    </main>
  );
}
