# FACTOS — Sherif (pnpm workspace lint)

> Fase F0. Fonte: npmjs.com/package/sherif.

## Factos

- Zero-config: `npx sherif` lista issues; **exit code 1** se houver erro (ideal p/ gate CI).
- Escrito em Rust; não precisa de `node_modules` (rápido).
- Regras relevantes: `multiple-dependency-versions`, `dependency-*`, `root-package-manager-field`,
  devDeps usadas em runtime, etc. — alinhado com o catálogo pnpm do blueprint.
- GitHub Action oficial: `QuiiBz/sherif@v1` (lê o script `sherif` do root package.json e usa os
  mesmos args; override com `args:`).
- **Recomendação oficial:** pinar a versão em CI (regressões quando uma lib nova entra sem
  atualizar siblings). atualmente ci.yml usa `npx sherif` sem pin.

## Aplicação ao Brócolis

1. Root `package.json`: adicionar script `"sherif": "sherif"`.
2. CI: trocar `run: npx sherif` por `npx sherif@<versão pinada>` ou `uses: QuiiBz/sherif@v1`
   (opcional `with: version: 'v1.x.y'`).
3. Não correr `--fix` em CI (autofix está desativado em CI por design — correto).