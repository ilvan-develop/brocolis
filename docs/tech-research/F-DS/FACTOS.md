# FACTOS — Bloco F-DS (Design System + UI)

> Pesquisa oficial antes de implementar a fase F-DS. Fonte primária: documentação oficial/vendor
> (W3C Design Tokens CG, Recharts, nativewind.dev, i18next.com). Auditado em 2026-08-20.
> Regra: "nenhuma stack sem pesquisa prévia" — este documento é a evidência.

## 1. Design Tokens (DTCG / W3C) — `@brocolis/design-tokens`

### Factos
- A spec do **W3C Community Group Design Tokens** atingiu a primeira versão estável **1.0 em 2025-10** (versão `2025.10` / "stable").
  - URL: `https://tr.designtokens.org/format/` (Formato) e `https://tr.designtokens.org/group/`.
- Formato JSON com sintaxe `$`:
  - `$value` (obrigatório), `$type` (obrigatório desde versão 1.0), `$description`, `$extensions`.
  - Alias via referência string: `"$value": "{color.brand.primary}"`.
- Tipos normalizados: `color`, `dimension`, `fontFamily`, `fontWeight`, `duration`, `cubicBezier`, `shadow`, `border`, `typography`, `number`, `string` (+ `gradient` e `transition` no 1.1/rec).
- File extension sugerida: `.tokens.json`; media type `application/design-tokens+json`.
- Goberna: **Style Dictionary v4** consome DTCG nativamente (`sd.config` + `tokens/` dir) e produz CSS/CSS variables por `preprocessors` a grupos. Suporta também o formato legado (props aninhadas) via flag `styleDictionary`.
- Para Tailwind, o DTCG não tem output oficial — a ponte é feita via **CSS variables** (o que o nosso `tokens.css` + `@theme inline` já faz).

### Gap / decisão aberta
- O `design.json` do F-DS já está em DTCG (97 tokens). Validar se usa `$type` em todos os grupos (o 1.0 exige `$type`); caso contrário, normalizar na fase F-DS.

## 2. Recharts — gráficos B2C/dashboard

### Factos (v3, 2026)
- **Recharts v3 é o standard**; **v2 está deprecated** (sem updates desde 2026-05). README do GitHub marca v2 como "old". VERSÃO NO PROJETO: `recharts@^3.8` (catálogo pnpm-workspace) → já é v3 ✓.
- Guia oficial de migração: `https://recharts.org/en-US/guide/3.0-migration-guide`.
- Principais breaking changes v2→v3:
  - Palavras reservadas do React (`width`, `height`, `data`, `tabIndex`, `defaultValue`, `options`) removidas como props de `<Chart>` — renomear para `chartWidth`/`chartHeight`.
  - `Customized` API mudou: substituído por render direto de componentes React arbitrários dentro do chart (sem wrapper); `Customized` mantém compat mas com interface nova.
  - Estado interno passou para hooks (nada de `this.state`); SSR-safe.
  - Deeps removidas: `react-smooth`, `recharts-scale`, `react-layout-instance`.
  - `accessibilityLayer` ativo por default; `isAnimationActive` mantido; `ResponsiveContainer` mantido.
  - props de animação `isAnimationActive`, `animationDuration` não são mais default `true`.
- Nota de acessibilidade: usar `accessibilityLayer` + `<Tooltip cursor />` e `role="img"` com `aria-label` descritivo (LGPD/a11y do blueprint).

## 3. NativeWind v4 — `apps/mobile`

### Factos (v4 + Tailwind)
- **NativeWind v4 só suporta Tailwind CSS v3** (erro "NativeWind only supports Tailwind CSS v3" ao usar tailwind v4 com v4). Para Tailwind v4 usar **NativeWind v5**.
  - Source: dev.to/cathylai (out-2025) e nativewind.dev/docs (2026-01-10, docs v4).
- Setup oficial v4 (Expo):
  1. `npm install nativewind react-native-reanimated react-native-safe-area-context` (peers obrigatórios de nativewind).
  2. `npm install -D tailwindcss@^3.4.17 prettier-plugin-tailwindcss@^0.5.11 babel-preset-expo`.
  3. `tailwind.config.js`: `content` = todos os ficheiros com classes; `presets: [require("nativewind/preset")]`.
  4. `global.css` com `@tailwind base; @tailwind components; @tailwind utilities;`.
  5. `babel.config.js`: `presets: [["babel-preset-expo", { jsxImportSource: "nativewind" }], "nativewind/babel"]`; se usar reanimated, `react-native-reanimated/plugin` tem de ser o ÚLTIMO plugin.
  6. `metro.config.js`: `withNativeWind(config, { input: "./global.css" })` (ou `"./app/globals.css"`).
  7. `app.json`: `expo.web.bundler = "metro"`.
  8. TS: ficheiro `nativewind-env.d.ts` com `/// <reference types="nativewind/types" />`, e incluí-lo no `tsconfig.json` (`"nativewind-env.d.ts"` no array `include`).
  9. Importar `global.css` no root layout (`app/_layout.tsx`).
- **NativeWind v5 (preview)** é o caminho atual para Tailwind v4 + react-native-css (CSS-first, sem Babel; usa `@tailwindcss/postcss`). Expo docs (2026-07-22) recomendam NativeWind v5 para Tailwind v4 em Expo SDK 52+/56+.
- Troubleshooting comum: `className` não funciona → Babel/Metro errado; limpar cache `npx expo start -c`; `watchman watch-del-all`.

### Gap / decisão aberta (importante)
- O catálogo pnpm-workspace **não lista `nativewind`**, mas o blueprint F-DS o exige (`nativewind@^4.0.0` no 01-STACK). Decisão: adicionar `nativewind` (e `react-native-safe-area-context`) ao catálogo antes de implementar apps/mobile. Escolher **v4 + Tailwind v3** (estável, alinhado ao blueprint) OU **v5 preview + Tailwind v4** (moderno, CSS-first). Recomendação: seguir o blueprint (`v4`), exceto se o Estado da stack (F-DS blueprint) já apontar Tailwind v4 → então v5.
- `@brocolis/tokens.css` usa Tailwind v4 (`@theme inline`)?
  - A ponte para NativeWind v4/Tailwind v3 teria de guardar tokens v4 num formato v3 (`tailwind.config.js` theme), OU usar o v3 `@theme`. Decidir na implementação F-DS/Mobile.

## 4. i18next / react-i18next — plurals e RN

### Factos
- **Desde i18next v24, `Intl.PluralRules` é obrigatório**: sem polyfill, i18next degrada para regras minimas inglesas `_one`/`_other` (erro console: "No Intl support, please use an Intl polyfill!").
- **React Native (Hermes) NÃO implementa `Intl.PluralRules`** → polifyl obrigatório em mobile:
  - `npm install intl-pluralrules` + `import "intl-pluralrules"` (package `eemeli/intl-pluralrules`, polyfill leve, ~2 lines).
  - Alternativa pesada: `@formatjs/intl-pluralrules` (lento em Hermes — issue #4276 do formatjs; usar `polyfill-force` + locale-data).
- `compatibilityJSON: 'v3'` foi **removido** no v24 — o polyfill é a única correção.
- Plurais pt-AO seguem a regra `Intl` do `pt` (1 / n>1) — 2 formas (`_one`/`_other`);
- Nomes de chave por significado, namespaces por feature, `lng` como BCP 47 (`pt-AO`), `fallbackLng` → mantém chaves nunca em branco.
- i18next v25 + react-i18next v15 no catálogo ✓ (sem gap). Para web (Next) e mobile (Expo) convém instanciar duas vezes (web e RN) — partilhando os mesmos ficheiros de locale em `@brocolis/i18n`.

## Conclusão (checklist acção)
1. `design.json` validar `$type` obrigatório (spec 1.0/2025.10).
2. Recharts já v3 ✓ — seguir guia migração, props renomeadas, `accessibilityLayer`.
3. Catálogo: **adicionar** `nativewind` (+ `react-native-safe-area-context`) antes de apps/mobile; decidir v4/Tailwind v3 vs v5/Tailwind v4.
4. i18next mobile: `intl-pluralrules` polyfill obrigatório (Hermes). Sempre BCP 47 `pt-AO`.