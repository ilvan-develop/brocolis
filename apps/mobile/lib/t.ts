import type { MessageKey } from "@brocolis/i18n";
import {
  getLocale as i18nGetLocale,
  setLocale as i18nSetLocale,
  t as i18nT,
} from "./i18n";

export const t = i18nT;
export const setLocale = i18nSetLocale;
export const getLocale = i18nGetLocale;
export type { MessageKey };
