import {
  defaultLocale,
  type Locale,
  type MessageKey,
  t as centralT,
} from "@brocolis/i18n";

// Mensagens vivem em @brocolis/i18n (fonte única de verdade, partilhada com
// apps/web). O mobile só mantém o estado do locale ativo no dispositivo.
let currentLocale: Locale = defaultLocale;

export function setLocale(locale: Locale): void {
  currentLocale = locale;
}

export function getLocale(): Locale {
  return currentLocale;
}

export function t(key: MessageKey): string {
  return centralT(key, currentLocale);
}

export type { Locale, MessageKey };
