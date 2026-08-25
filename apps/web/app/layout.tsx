import type { Metadata } from "next";
import { HtmlLang } from "@/components/html-lang";
import { LocaleProvider } from "@/components/locale-provider";
import { SessionProvider } from "@/components/session-provider";
import { SkipLink } from "@/components/skip-link";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Brócolis",
  description:
    "Marketplace farmacêutico multi-tenant — Angola-first, Africa by design.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <HtmlLang>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <LocaleProvider>
            <SessionProvider>
              <SkipLink />
              {children}
            </SessionProvider>
          </LocaleProvider>
        </ThemeProvider>
      </body>
    </HtmlLang>
  );
}
