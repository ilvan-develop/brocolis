"use client";

import type { ReactNode } from "react";
import { createContext, useContext, useEffect, useState } from "react";

export type Locale = "pt-AO" | "pt-MZ" | "en-KE" | "en-NG" | "fr-SN" | "ar-EG";

export const SUPPORTED_LOCALES: Locale[] = [
  "pt-AO",
  "pt-MZ",
  "en-KE",
  "en-NG",
  "fr-SN",
  "ar-EG",
];

type LocaleContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

function getInitialLocale(): Locale {
  if (typeof window === "undefined") return "pt-AO";
  const stored = window.localStorage.getItem("brocolis.locale");
  if (stored && SUPPORTED_LOCALES.includes(stored as Locale)) {
    return stored as Locale;
  }
  return "pt-AO";
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(getInitialLocale);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === "ar-EG" ? "rtl" : "ltr";
    if (typeof window !== "undefined") {
      window.localStorage.setItem("brocolis.locale", locale);
    }
  }, [locale]);

  const setLocale = (next: Locale) => {
    setLocaleState(next);
  };

  return (
    <LocaleContext.Provider value={{ locale, setLocale }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale(): LocaleContextValue {
  const context = useContext(LocaleContext);
  if (!context) {
    return { locale: "pt-AO", setLocale: () => {} };
  }
  return context;
}
