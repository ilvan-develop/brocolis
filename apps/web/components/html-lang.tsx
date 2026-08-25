"use client";

import { useLocale } from "@/components/locale-provider";

export function HtmlLang({ children }: { children: React.ReactNode }) {
  const { locale } = useLocale();

  return (
    <html lang={locale} suppressHydrationWarning>
      {children}
    </html>
  );
}
