# ADR-0005: Biome como lint + format (sem ESLint/Prettier)

- **Estado:** Aceite
- **Data:** 2026-08-20

## Contexto

O template Turborepo/Vercel sugere ESLint + Prettier com packages `@repo/eslint-config`.

## Decisão

Usar **Biome 2** na raiz (`biome.json`) para lint e format, com regras extras
(`noUnusedImports`, `noFloatingPromises`). Apenas `import` do `@biomejs/biome` root.

## Consequências

Config única partilhada (AP-07), sem packages de configuração duplicados; formato
mais rápido que ESLint+Prettier.