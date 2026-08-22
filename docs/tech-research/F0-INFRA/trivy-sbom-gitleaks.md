# FACTOS — SBOM + Trivy + Gitleaks (Supply-chain)

> Fase F0. Fontes: pnpm.io/cli/sbom, trivy.dev (sbom target + CLI ref),
> github.com/CycloneDX/cyclonedx-node-npm, github.com/gitleaks/gitleaks (README + pre-commit-hooks).

## 1. Geração de SBOM — usar `pnpm sbom` (nativo)

`pnpm` v11.0.0+ tem SBOM nativo (CycloneDX 1.7 / SPDX 2.3). Desde v11.8.0 aceita `--out`:

```bash
pnpm sbom --sbom-format cyclonedx --out sbom.cdx.json
pnpm sbom --sbom-format cyclonedx --lockfile-only          # a partir do lockfile
pnpm sbom --sbom-format cyclonedx --prod                   # apenas runtime deps
```

- `--split` + `--out out/%s.cdx.json` → um SBOM por workspace package.
- `--exclude-peers` recomendado com `auto-install-peers` (evita peers que parecem regulares).
- **Verdict:** substituir `pnpm dlx cyclonedx-npm --output-file sbom.json` por `pnpm sbom`.
  (cyclonedx-npm requer `npm >= 9` e depende do ecossistema npm; `pnpm sbom` é o caminho canónico
  no nosso `pnpm 11.21` / catálogo strict.)

## 2. Scan com Trivy — `trivy sbom`

```bash
trivy sbom sbom.cdx.json --severity CRITICAL,HIGH --exit-code 1 --no-progress --scanners vuln
```

- O formato de entrada é auto-detetado (CycloneDX JSON suportado; **XML não**).
- `--exit-code <n>`: sai com `n` quando são encontrados problemas acima do filtro.
- `--scanners vuln,license` para incluir licenças (opcional).
- Referência de implementação atual (má): o `supply-chain.yaml` tem um fallback `|| trivy ... --severity CRITICAL` —
  esse segundo comando é maioritariamente código morto/confuso; manter um único scan com severidade
  CRITICAL,HIGH e fail.
- Nota: SBOMs gerados por outra ferramenta dão deteção potencialmente imprecisa — ao gerar com
  `pnpm sbom` e scanar com trivy, a precisão é aceitável; para scanner exato de imagem usar
  `acquasecurity/trivy-action` com `image-ref`.

## 3. Gitleaks — pré-commit + CI

Comandos canónicos (binário Go, NÃO `pnpm gitleaks`):

| Contexto | Comando |
|----------|---------|
| Pré-commit (staged, redact) | `gitleaks git --pre-commit --redact --staged --verbose` |
| Pré-commit (alias moderno) | `gitleaks protect --staged --redact -v` |
| Scan da árvore toda (CI) | `gitleaks detect --source . --no-git --redact --verbose --exit-code 1` |
| Histórico completo | `gitleaks detect` |

- Exit code não-zero quando encontra leak → falha o job/hook automaticamente.
- `--redact` mascara o valor nos logs (CI partilhado/visível).
- CI: `gitleaks/gitleaks-action@v2` (annotations PR) — gratis para repos públicos; para privados,
  correr o binário go diretamente (MIT) evita a dependência de licença da action.
- Framework `pre-commit`: `pre-commit-hooks.yaml` com `rev` pinada (ex. v8.24.2), id `gitleaks`.

## Kernel para o Brócolis (concretizar numa wave de implementação)

1. `package.json` root: script `"sbom": "pnpm sbom --sbom-format cyclonedx --out sbom.cdx.json"`.
2. `supply-chain.yaml`: `pnpm sbom` em vez de `cyclonedx-npm`; scan único trivy.
3. `.husky/pre-commit`: Gitleaks ANTES do lint-staged:
   ```bash
   gitleaks git --pre-commit --redact --staged --verbose
   ```
4. CI: job com `gitleaks/gitleaks-action@v2` (`fetch-depth: 0`) para PR.
5. Corrigir `blueprint/01-...§7.5` (que citava `pnpm gitleaks detect --staged`) e a referência no
   `.husky/pre-commit` atual — anticoagido com o comando canónico acima.