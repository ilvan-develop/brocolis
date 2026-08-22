import { formatCurrency } from "@brocolis/formatters";
import { t } from "@brocolis/i18n";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@brocolis/ui";

export default function MarketingLanding() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 p-8">
      <header className="flex flex-col items-center gap-3 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Brócolis</h1>
        <Badge>{t("pharmacy.verified")}</Badge>
      </header>

      <section className="flex w-full max-w-md flex-col gap-4">
        <Card>
          <CardHeader>
            <CardTitle>{t("checkout.title")}</CardTitle>
            <CardDescription>{t("checkout.summary")}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <p className="text-sm text-muted-foreground">
              {t("commerce.stock.available")}
            </p>
            <p className="text-xl font-semibold">
              {formatCurrency(12500, "AOA")}
            </p>
          </CardContent>
          <CardFooter className="justify-between">
            <Button asChild>
              <a href="/register">{t("nav.signup")}</a>
            </Button>
            <Button asChild variant="outline">
              <a href="/sign-in">{t("nav.signin")}</a>
            </Button>
          </CardFooter>
        </Card>
      </section>

      <p className="text-sm text-muted-foreground">
        {t("pharma.whatsApp.support")}
      </p>
    </main>
  );
}
