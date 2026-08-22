import type { MessageKey } from "@brocolis/i18n";
import type { ReactNode } from "react";
import { t as translate } from "@/lib/t";

type TranslationProps = {
  k: MessageKey;
  fallback?: string;
};

export function T({ k, fallback }: TranslationProps): ReactNode {
  const text = translate(k);
  return text === k && fallback ? fallback : text;
}
