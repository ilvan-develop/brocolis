"use client";

import { Button } from "@brocolis/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@brocolis/ui/components/dropdown-menu";
import { ChevronDown } from "lucide-react";
import { SUPPORTED_LOCALES, useLocale } from "@/components/locale-provider";

const LOCALE_LABELS: Record<string, string> = {
  "pt-AO": "🇦🇴 PT-AO",
  "pt-MZ": "🇲🇿 PT-MZ",
  "en-KE": "🇰🇪 EN-KE",
  "en-NG": "🇳🇬 EN-NG",
  "fr-SN": "🇸🇳 FR-SN",
  "ar-EG": "🇪🇬 AR-EG",
};

export function LocaleSwitcher() {
  const { locale, setLocale } = useLocale();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1">
          <span>{LOCALE_LABELS[locale]}</span>
          <ChevronDown className="size-3.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {SUPPORTED_LOCALES.map((supported) => (
          <DropdownMenuItem
            key={supported}
            onClick={() => setLocale(supported)}
            className={locale === supported ? "bg-accent" : ""}
          >
            {LOCALE_LABELS[supported]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
